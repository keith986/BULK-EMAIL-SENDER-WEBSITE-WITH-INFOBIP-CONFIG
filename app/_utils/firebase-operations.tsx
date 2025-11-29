import { addDoc, setDoc, collection, doc, getDocs, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import {db} from '../_lib/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword as firebaseSignIn } from "firebase/auth";
import { auth } from '../_lib/firebase';
import { hashPassword, verifyPassword } from './hash-password';

const COLLECTION_API_NAME = "apikeys";
const COLLECTION_BATCH_NAME = "batchsettings";
const COLLECTION_RECIPIENTS_NAME = "recipients";
const COLLECTION_CAMPAIGNS_NAME = "campaigns";
const COLLECTIONS_CLIENTS = "clients";

type ClientDocument = {
  email?: string | null;
  displayName?: string | null;
  hashedPassword?: string | null;
};

export const uploadApiDataToFirebase = async ({userId, apiKey}: {userId: string, apiKey: string}): Promise<{code: number, message: string}> => {
  try {
    // Check if userId already exists
    const q = query(collection(db, COLLECTION_API_NAME), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User already exists, update the existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_API_NAME, existingDoc.id), {
        apiKey: apiKey
      });
      
      return { code: 777, message: 'Your Api Key has been updated successfully.' };
    } else {
      // User doesn't exist, create new document
      const userData = {
        userId: userId,
        apiKey: apiKey
      };
      await addDoc(collection(db, COLLECTION_API_NAME), userData);
      return { code: 777, message: 'Your Api Key has ben saved successfully.' };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('uploadApiDataToFirebase error:', error);
    return { code: 101, message };
  }
}

export const uploadBatchSettingsToFirebase = async ({userId, batchsize, batchdelay}:{userId: string, batchsize: string, batchdelay: string}):Promise<{code: number, message: string}> => {
  try {
    // Check if userId already exists
    const q = query(collection(db, COLLECTION_BATCH_NAME), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User already exists, update the existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_BATCH_NAME, existingDoc.id), {
        batchsize: batchsize,
        batchdelay: batchdelay
      });
      
      return { code: 777, message: 'Your configuration has been updated successfully.' };
    } else {
      // User doesn't exist, create new document
      const batchData = {
        userId: userId,
        batchsize: batchsize,
        batchdelay: batchdelay
      };
      await addDoc(collection(db, COLLECTION_BATCH_NAME), batchData);
      return { code: 777, message: 'Your configuration is saved successfully.' };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('uploadBatchSettingsToFirebase error:', error);
    return { code: 101, message };
  }
}

/*
export const  uploadEmailAddressesToFirebase = async ({data: any}) => {
    try{
        const emailData = {
            userId: data.userId,
            records: data.map((address) => address)
        }
    export const signInWithEmailandPassword = async ({email, password}: {email: string, password: string}): Promise<{code: number, message: string, uid?: string, errorCode?: string | null}> => {
      try {
        // find the user document in clients collection
        const q = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
        const snap = await getDocs(q);
        if (snap.empty) {
          return { code: 404, message: 'No user found for that email.' };
        }

        const userDoc = snap.docs[0];
        const data = userDoc.data() as any;
        const stored = data.hashedPassword;

        if (!stored) {
          // No stored hashed password — can't verify on client
          return { code: 404, message: 'No stored password for this user.' };
        }

        const ok = await verifyPassword(password, stored);
        if (!ok) {
          return { code: 401, message: 'Invalid password.' };
        }

        // password matched — now sign in with Firebase Authentication to create a real session
        const userCredential = await firebaseSignIn(auth, email, password);
        const user = userCredential.user;
        return { code: 777, message: 'signed in successfully.', uid: user.uid };

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const errorCode = (err as { code?: string } | undefined)?.code ?? null;
        console.error('signInWithEmailandPassword error:', err);
        return { code: 101, message, errorCode };
      }
    }
    }catch(err){
        return {code: 101, message: err.message}
    }
}
*/
// Save recipients to Firebase
export const uploadRecipientsToFirebase = async ({
  userId, 
  recipients, 
  totalCount, 
  rawText
}: {
  userId: string, 
  recipients: Array<{name: string, email: string}>, 
  totalCount: number, 
  rawText: string
}): Promise<{code: number, message: string, added?: number}> => {
  try {
    // Check if userId already exists
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User already exists, merge with existing recipients and avoid duplicates
      const existingDoc = querySnapshot.docs[0];
      const data = existingDoc.data() as { recipients?: Array<{ name?: string; email?: string }>; rawText?: string; totalCount?: number };
      const existingList = Array.isArray(data.recipients) ? data.recipients as Array<{ name?: string; email?: string }> : [];

      // Normalize incoming recipients and remove any without email
      const incoming = Array.isArray(recipients) ? recipients.filter(r => r && r.email).map(r => ({ name: r.name ?? '', email: String(r.email).trim() })) : [];

      // Build map of lowercased existing emails
      const existingMap = new Map<string, { name?: string; email: string }>();
      for (const r of existingList) {
        if (!r?.email) continue;
        existingMap.set(String(r.email).toLowerCase(), { name: r.name, email: String(r.email) });
      }

      // Count new additions and merge
      let addedCount = 0;
      for (const inc of incoming) {
        const key = inc.email.toLowerCase();
        if (!existingMap.has(key)) {
          existingMap.set(key, { name: inc.name || '', email: inc.email });
          addedCount++;
        }
      }

      const merged = Array.from(existingMap.values());

      await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, existingDoc.id), {
        recipients: merged,
        totalCount: merged.length,
        rawText: merged.map(r => r.email).join('\n'),
        updatedAt: serverTimestamp()
      });

      return { code: 777, message: `Recipients updated — ${addedCount} new added.`, added: addedCount };
    } else {
      // User doesn't exist, create new document
      const recipientsData = {
        userId: userId,
        recipients: recipients,
        totalCount: totalCount,
        rawText: rawText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, COLLECTION_RECIPIENTS_NAME), recipientsData);
      return { code: 777, message: 'Recipients list has been saved successfully.', added: recipientsData.recipients?.length ?? 0 };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('uploadRecipientsToFirebase error:', error);
    return { code: 101, message };
  }
}

// Fetch recipients from Firebase
export const fetchRecipientsFromFirebase = async ({userId}: {userId: string}): Promise<{
  code: number, 
  data?: {
    recipients: Array<{name: string, email: string}>, 
    totalCount: number, 
    rawText: string
  }, 
  message: string
}> => {
  try {
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const recipientsDoc = querySnapshot.docs[0];
      const data = recipientsDoc.data();
      return {
        code: 777,
        data: {
          recipients: data.recipients || [],
          totalCount: data.totalCount || 0,
          rawText: data.rawText || ''
        },
        message: 'Recipients found successfully.'
      };
    } else {
      return { code: 404, message: 'No recipients found for this user.' };
    }
  } catch (error: unknown) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error('fetchRecipientsFromFirebase error:', error);
    return { code: 101, message };
  }
}

// Fetch campaign history for a user
export const fetchCampaignsFromFirebase = async ({ userId }: { userId: string }): Promise<{
  code: number;
  data?: Array<{
    id: string;
    userId: string;
    subject?: string;
    recipientsCount?: number;
    results?: Array<Record<string, unknown>>;
    stats?: { total?: number; sent?: number; failed?: number };
    createdAt?: { seconds?: number } | string;
  }>;
  message: string;
}> => {
  try {
    const q = query(collection(db, COLLECTION_CAMPAIGNS_NAME), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) return { code: 404, message: 'No campaigns found for this user.' };

    const campaigns = snap.docs.map(d => {
      const raw = d.data() as { subject?: string; recipientsCount?: number; results?: Array<Record<string, unknown>>; stats?: { total?: number; sent?: number; failed?: number }; createdAt?: { seconds?: number } | string; userId?: string };
      return { id: d.id, userId: raw.userId ?? userId, subject: raw.subject, recipientsCount: raw.recipientsCount, results: raw.results, stats: raw.stats, createdAt: raw.createdAt };
    });
    // sort by createdAt descending if present
    campaigns.sort((a, b) => {
      const getTimestamp = (t: { seconds?: number } | string | undefined) => {
        if (!t) return 0;
        if (typeof t === 'object') {
          const seconds = (t as { seconds?: number }).seconds;
          if (typeof seconds === 'number') return seconds;
        }
        const ms = Date.parse(String(t));
        return isNaN(ms) ? 0 : Math.floor(ms / 1000);
      };
      const ta = getTimestamp(a.createdAt);
      const tb = getTimestamp(b.createdAt);
      return tb - ta;
    });

    return { code: 777, data: campaigns, message: 'Campaigns fetched.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('fetchCampaignsFromFirebase error:', error);
    return { code: 101, message };
  }
};

// Remove a recipient from a user's recipients document by email
export const removeRecipientFromFirebase = async ({ userId, email }: { userId: string; email: string }): Promise<{ code: number; message: string }> => {
  try {
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return { code: 404, message: 'No recipients document found for user.' };

    const recipientsDoc = querySnapshot.docs[0];
    const data = recipientsDoc.data() as { recipients?: Array<{ name?: string; email?: string }>; rawText?: string; totalCount?: number };
    const rawList = Array.isArray(data.recipients) ? data.recipients as Array<{ name?: string; email?: string }> : [];
    const existing: Array<{ name?: string; email: string }> = rawList.filter(r => r.email).map(r => ({ name: r.name, email: r.email! }));

    const filtered = existing.filter(r => String(r.email).toLowerCase() !== String(email).toLowerCase());

    await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, recipientsDoc.id), {
      recipients: filtered,
      totalCount: filtered.length,
      rawText: filtered.map(r => (r.email ? r.email : '')).join('\n'),
      updatedAt: serverTimestamp()
    });

    return { code: 777, message: 'Recipient removed.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('removeRecipientFromFirebase error:', error);
    return { code: 101, message };
  }
}

// Remove multiple recipients by email from a user's recipients document
export const removeRecipientsFromFirebase = async ({ userId, emails }: { userId: string; emails: string[] }): Promise<{ code: number; message: string }> => {
  try {
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return { code: 404, message: 'No recipients document found for user.' };

    const recipientsDoc = querySnapshot.docs[0];
    const data = recipientsDoc.data() as { recipients?: Array<{ name?: string; email?: string }>; rawText?: string; totalCount?: number };
    const rawList = Array.isArray(data.recipients) ? data.recipients as Array<{ name?: string; email?: string }> : [];
    const existing: Array<{ name?: string; email: string }> = rawList.filter(r => r.email).map(r => ({ name: r.name, email: r.email! }));

    const emailsSet = new Set(emails.map(e => String(e).toLowerCase()));
    const filtered = existing.filter(r => !emailsSet.has(String(r.email).toLowerCase()));

    await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, recipientsDoc.id), {
      recipients: filtered,
      totalCount: filtered.length,
      rawText: filtered.map(r => (r.email ? r.email : '')).join('\n'),
      updatedAt: serverTimestamp()
    });

    return { code: 777, message: `${emails.length} recipient(s) removed.` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('removeRecipientsFromFirebase error:', error);
    return { code: 101, message };
  }
}

//sign up with email and password
export const signUpWithEmailandPassword = async ({username, email, password}: {username: string, email: string, password: string}): Promise<{code: number, message: string, uid?: string, errorCode?: string | null}> => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Hash the password before storing it in Firestore (we still pass plaintext to Firebase Auth)
    const hashed = await hashPassword(password);
    await setDoc(doc(db, COLLECTIONS_CLIENTS, user.uid), {
      email,
      displayName: username || '',
      hashedPassword: hashed,
      createdAt: serverTimestamp()
    });

    return { code: 777, message: 'signed up successfully.', uid: user.uid };
  } catch (error: unknown) {
    // Log to console and return consistent structure for the UI to display
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string } | undefined)?.code ?? null;
    console.error('signUpWithEmailandPassword error:', error);
    return { code: 101, message, errorCode };
  }
}

//sign up with google account
export const signUpWithGoogleAccount = async () : Promise<{code: number, message: string, uid?: string, errorCode?: string | null}> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, COLLECTIONS_CLIENTS, user.uid), {
      email: user.email,
      displayName: user.displayName || '',
      hashedPassword: null,
      createdAt: serverTimestamp()
    });

    return { code: 777, message: 'signed up successfully.', uid: user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string } | undefined)?.code ?? null;
    console.error('signUpWithGoogleAccount error:', error);
    return { code: 101, message, errorCode };
  }
}

// Update client profile (displayName and optional password)
export const updateClientProfile = async ({ userId, displayName, password }: { userId: string; displayName?: string | null; password?: string | null }): Promise<{ code: number; message: string }> => {
  try {
    if (!userId) return { code: 400, message: 'Missing userId' };

    const updates: Record<string, unknown> = {};
    if (typeof displayName === 'string') updates.displayName = displayName;

    // If a raw password is provided, hash it before storing
    if (typeof password === 'string' && password.length > 0) {
      const hashed = await hashPassword(password);
      updates.hashedPassword = hashed;
    }

    // Set updatedAt timestamp
    updates.updatedAt = serverTimestamp();

    // Use setDoc with merge so we don't overwrite other fields accidentally
    await setDoc(doc(db, COLLECTIONS_CLIENTS, userId), updates, { merge: true });

    return { code: 777, message: 'Profile updated successfully.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('updateClientProfile error:', error);
    return { code: 101, message };
  }
}

//sign in with email and password
export const signInWithEmailandPassword = async ({email, password}: {email: string, password: string}): Promise<{code: number, message: string, uid?: string, errorCode?: string | null}> => {
  try {
    // Lookup client profile by email
    const q = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return { code: 404, message: 'No account found for that email.' };

    const client = snap.docs[0].data() as ClientDocument;
    const stored = client?.hashedPassword;
    if (!stored) return { code: 404, message: 'No stored password for this account.' };

    const verified = await verifyPassword(password, stored);
    if (!verified) return { code: 401, message: 'Invalid credentials.' };

    // Password verified — sign in with Firebase (creates a valid session)
    const userCredential = await firebaseSignIn(auth, email, password);
    const user = userCredential.user;
    return { code: 777, message: 'signed in successfully.', uid: user.uid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const errorCode = (err as { code?: string } | undefined)?.code ?? null;
    console.error('signInWithEmailandPassword error:', err);
    return { code: 101, message, errorCode };
  }
}


