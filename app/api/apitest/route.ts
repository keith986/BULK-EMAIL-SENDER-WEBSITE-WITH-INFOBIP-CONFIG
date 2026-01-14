import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../_lib/firebase';

export const dynamic = 'force-dynamic';

// POST /api/apitest  { userId }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    if (!userId) return NextResponse.json({ code: 400, message: 'userId required' }, { status: 400 });

    const q = query(collection(db, 'apikeys'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return NextResponse.json({ code: 404, message: 'No API configured for user' }, { status: 404 });

    const apiDoc = snapshot.docs[0].data();
    if (!apiDoc.apiKey) return NextResponse.json({ code: 404, message: 'No API key configured' }, { status: 404 });

    const apiKey = apiDoc.apiKey;
    const baseUrl = apiDoc.baseUrl || 'https://api.infobip.com';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/email/3/send`;

    // perform a lightweight HEAD/OPTIONS or small POST test using server-side stored key
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json'
        },
        // minimal test payload (won't actually send a real email if provider rejects)
        body: JSON.stringify({
          from: apiDoc.from || 'noreply@example.com',
          to: [{ email: 'test@example.com' }],
          subject: 'API Test',
          html: '<p>Test</p>'
        })
      });

      const ok = resp.ok;
      const status = resp.status;
      const text = await resp.text();

      return NextResponse.json({ code: ok ? 777 : 400, ok, status, body: text });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ code: 500, message: 'API test failed: ' + msg }, { status: 500 });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}

// GET /api/apitest?userId=...
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ code: 400, message: 'userId required' }, { status: 400 });

    const q = query(collection(db, 'apikeys'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return NextResponse.json({ code: 404, configured: false });
    const apiDoc = snapshot.docs[0].data();
    return NextResponse.json({ code: 777, configured: !!apiDoc.apiKey });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
  return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
