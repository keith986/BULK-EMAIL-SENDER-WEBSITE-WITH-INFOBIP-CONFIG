import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../_lib/firebase';

async function fetchApiKeyForUser(userId = '123') {
  const q = query(collection(db, 'apikeys'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { docRef: snapshot.docs[0].ref, data: snapshot.docs[0].data() };
}

async function fetchBatchSettingsForUser(userId = '123') {
  const q = query(collection(db, 'batchsettings'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = '123', subject, html, recipients } = body;

    if (!subject || !html || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ code: 400, message: 'Missing subject, Email Content, or recipients' }, { status: 400 });
    }

    // Verify user has coins before allowing send
    const coinsQuery = query(collection(db, 'coins'), where('userId', '==', userId));
    const coinsSnapshot = await getDocs(coinsQuery);
    const currentCoins = !coinsSnapshot.empty ? (coinsSnapshot.docs[0].data().coins || 0) : 0;

    if (!currentCoins || currentCoins <= 0) {
      // Remove API key server-side to prevent usage
      const apiDocWrap = await fetchApiKeyForUser(userId);
      if (apiDocWrap && apiDocWrap.docRef) {
        try { await updateDoc(apiDocWrap.docRef, { apiKey: '', updatedAt: new Date().toISOString() }); } catch (e) { console.error('Failed to clear api key for user:', e); }
      }
      return NextResponse.json({ code: 403, message: 'No coins available. API access revoked.' }, { status: 403 });
    }

    const apiDocWrap = await fetchApiKeyForUser(userId);
    if (!apiDocWrap || !apiDocWrap.data || !apiDocWrap.data.apiKey) {
      return NextResponse.json({ code: 400, message: 'API key not configured for user' }, { status: 400 });
    }

    const apiDoc = apiDocWrap.data as any;

    const batchDoc = await fetchBatchSettingsForUser(userId);
    const batchSize = batchDoc && batchDoc.batchsize ? parseInt(String(batchDoc.batchsize), 10) : 10;
    const batchDelay = batchDoc && batchDoc.batchdelay ? parseInt(String(batchDoc.batchdelay), 10) : 1000;

    const apiKey = apiDoc.apiKey;
    const baseUrl = apiDoc.baseUrl || 'https://api.infobip.com';

    const endpoint = `${baseUrl.replace(/\/$/, '')}/email/3/send`;

    // chunk recipients
    const chunks: Array<Array<{ email: string }>> = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      chunks.push(recipients.slice(i, i + batchSize));
    }

    const results: Array<Record<string, unknown>> = [];

    let sentCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i];

      for (const r of batch) {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `App ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: apiDoc.from || 'noreply@example.com',
              to: [{ email: r.email }],
              subject,
              html
            })
          });

          const respBody = await resp.text();
          results.push({ email: r.email, status: resp.ok ? 'sent' : 'error', statusCode: resp.status, body: respBody });
          if (resp.ok) sentCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ email: r.email, status: 'error', message: msg });
        }
      }

      // delay between batches if more batches remain
      if (i < chunks.length - 1) {
        await new Promise((res) => setTimeout(res, batchDelay));
      }
    }

    // Persist campaign history to Firestore so users can review later
    try {
      const campaignDoc = {
        userId,
        subject,
        recipientsCount: recipients.length,
        results,
        stats: {
          total: recipients.length,
          sent: results.filter((r) => String(r.status) === 'sent').length,
          failed: results.filter((r) => String(r.status) !== 'sent').length,
        },
        createdAt: new Date().toISOString(),
      };
      // write to campaigns collection
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'campaigns'), { ...campaignDoc, createdAt: serverTimestamp() });
    } catch (saveErr) {
      console.error('Failed to save campaign history:', saveErr);
    }

      // Deduct sentCount from user's coins and clients.emailsRemaining
      try {
        if (sentCount > 0) {
          const q = query(collection(db, 'coins'), where('userId', '==', userId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const coinsDoc = snap.docs[0];
            const current = coinsDoc.data().coins || 0;
            const newBalance = Math.max(0, current - sentCount);
            await updateDoc(doc(db, 'coins', coinsDoc.id), { coins: newBalance, updatedAt: new Date().toISOString() });
          }

          const clientRef = doc(db, 'clients', userId);
          try {
            const clientDoc = await getDoc(clientRef);
            if (clientDoc.exists()) {
              const c = clientDoc.data() as any;
              const newRemaining = Math.max(0, (c.emailsRemaining || 0) - sentCount);
              await updateDoc(clientRef, { emailsRemaining: newRemaining, updatedAt: new Date().toISOString() });
            }
          } catch (e) {
            console.error('Failed to update client emailsRemaining:', e);
          }
        }
      } catch (e) {
        console.error('Error deducting coins after send:', e);
      }

      return NextResponse.json({ code: 777, message: 'Batch send completed', results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ code: 101, message: msg }, { status: 500 });
  }
}
