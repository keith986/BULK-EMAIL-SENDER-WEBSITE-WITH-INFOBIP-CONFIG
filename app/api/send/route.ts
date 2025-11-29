import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../_lib/firebase';

async function fetchApiKeyForUser(userId = '123') {
  const q = query(collection(db, 'apikeys'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
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

    const apiDoc = await fetchApiKeyForUser(userId);
    if (!apiDoc || !apiDoc.apiKey) {
      return NextResponse.json({ code: 400, message: 'API key not configured for user' }, { status: 400 });
    }

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

    return NextResponse.json({ code: 777, message: 'Batch send completed', results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ code: 101, message: msg }, { status: 500 });
  }
}
