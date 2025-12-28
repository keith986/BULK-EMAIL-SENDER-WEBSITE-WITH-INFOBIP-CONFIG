import { addDoc, setDoc, collection, doc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp, getDoc, orderBy, limit } from "firebase/firestore";
import {db} from '../_lib/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword as firebaseSignIn } from "firebase/auth";
import { auth } from '../_lib/firebase';
import { hashPassword, verifyPassword } from './hash-password';

const COLLECTION_API_NAME = "apikeys";
const COLLECTION_BATCH_NAME = "batchsettings";
const COLLECTION_RECIPIENTS_NAME = "recipients";
const COLLECTION_CAMPAIGNS_NAME = "campaigns";
const COLLECTIONS_CLIENTS = "clients";
const COLLECTION_GROUPS_NAME = "groups";
const COLLECTION_COINS_NAME = "coins";
const COLLECTION_TRANSACTIONS_NAME = "transactions";
const COLLECTION_PURCHASE_REQUESTS = "purchaseRequests";
const COLLECTION_OTP_NAME = "otps";
const COLLECTION_ADMIN_LOGS_NAME = "adminLoginLogs";
const COLLECTION_CLIENT_LOGS_NAME = "clientLoginLogs";
const COLLECTION_PAYMENTS = "payments";
const COLLECTION_SYSTEM_SETTINGS = "systemSettings";
const SYSTEM_SETTINGS_DOC_ID = "config";

export interface SystemSettings {
  maxRecipientsPerCampaign: number;
  registrationEnabled: boolean;
  autoApprovePayments?: boolean;
}

// Define contact limits for each package
export const PACKAGE_LIMITS = {
  'free': 1,
  '2000c': 2000,
  '6000c': 6000,
  '10000c': 10000,
  'customc': Infinity
} as const;

type ClientDocument = {
  email?: string | null;
  displayName?: string | null;
  hashedPassword?: string | null;
};

interface AdminLoginLog {
  adminEmail: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified' | 'otp_resent';
  failureReason?: string;
  timestamp: Date;
  sessionDuration?: number;
}

interface ClientLoginLog {
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified' | 'otp_resent';
  failureReason?: string;
  timestamp: Date;
  sessionDuration?: number;
}

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
  recipients: Array<{name: string, email: string, username?: string}>, 
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
      const data = existingDoc.data() as { recipients?: Array<{ name?: string; email?: string; username?: string }>; rawText?: string; totalCount?: number };
      const existingList = Array.isArray(data.recipients) ? data.recipients as Array<{ name?: string; email?: string; username?: string }> : [];

      // Normalize incoming recipients and remove any without email
      const incoming = Array.isArray(recipients) ? recipients.filter(r => r && r.email).map(r => ({ name: r.name ?? '', email: String(r.email).trim(), username: r.username ?? '' })) : [];

      // Build map of lowercased existing emails
      const existingMap = new Map<string, { name?: string; email: string; username?: string }>();
      for (const r of existingList) {
        if (!r?.email) continue;
        existingMap.set(String(r.email).toLowerCase(), { name: r.name, email: String(r.email), username: r.username });
      }

      // Count new additions and merge
      let addedCount = 0;
      for (const inc of incoming) {
        const key = inc.email.toLowerCase();
        if (!existingMap.has(key)) {
          existingMap.set(key, { name: inc.name || '', email: inc.email, username: inc.username || '' });
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

/*sign up with google account
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
      createdAt: serverTimestamp(),
      role: 'customer'
    });

    return { code: 777, message: 'signed up successfully.', uid: user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string } | undefined)?.code ?? null;
    console.error('signUpWithGoogleAccount error:', error);
    return { code: 101, message, errorCode };
  }
}
*/

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

// Delete API data for a user
export const deleteApiDataToFirebase = async ({userId}: {userId: string}): Promise<{code: number, message: string}> => {
  try{
    // Check if userId exists
    const q = query(collection(db, COLLECTION_API_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // User exists, delete the existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_API_NAME, existingDoc.id), {apiKey: ""});
      return { code: 777, message: 'Your Api Key has been deleted successfully.' };
    } else {
      return { code: 101, message: 'No Api Key found.' };
    }
  }catch(error){
    const message = error instanceof Error ? error.message : String(error);
    console.error('deleteApiDataToFirebase error:', error);
    return { code: 101, message };
  }
}

// Fetch Api Data for a user
export const fetchApiKeyFromFirebase = async ({userid}: {userid: string}): Promise<{code: number, data?: {apiKey: string}, message?: string}> => {
  try{
    //check if userId exists
    const q = query(collection(db, COLLECTION_API_NAME), where('userId', '==', userid));
    const querySnapshot = await getDocs(q);
    if(!querySnapshot.empty){
      const ApiDoc = querySnapshot.docs[0];
      const data = ApiDoc.data();
      return {code: 777, data: {apiKey: data.apiKey} };
    }else{
      return {code: 101};
    }
  }catch(error){
    const message = error instanceof Error ? error.message : String(error);
    console.error('fetchApiKeyFromFirebase error:', error);
    return { code: 101, message };
  }
}

// Delete Batch Settings for a user
export const deleteBatchSettingsFromFirebase = async ({userId}: {userId: string}): Promise<{code: number, message: string}> => {
  try{
    // Check if userId exists
    const q = query(collection(db, COLLECTION_BATCH_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // User exists, delete the existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_BATCH_NAME, existingDoc.id), {batchSize: "", delayBetweenBatches: ""});
      return { code: 777, message: 'Your Batch Settings have been deleted successfully.' };
    } else {
      return { code: 101, message: 'No Batch Settings found.' };
    }
  }catch(error){
    const message = error instanceof Error ? error.message : String(error);
    console.error('deleteBatchSettingsFromFirebase error:', error);
    return { code: 101, message };
  }
}

// Add this function to your firebase-operations.ts file

export async function updateRecipientGroups({ 
  userId, 
  email, 
  groups 
}: { 
  userId: string; 
  email: string; 
  groups: string[] 
}) {
  try {
    // Query to find the user's recipients document
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No recipients document found for user:', userId);
      return {
        code: 404,
        message: 'No recipients document found for user',
        error: 'Document not found'
      };
    }

    // Get the recipients document
    const recipientsDoc = querySnapshot.docs[0];
    const data = recipientsDoc.data() as { 
      recipients?: Array<{ name?: string; email?: string; groups?: string[] }>;
      rawText?: string;
      totalCount?: number;
    };
    
    // Get existing recipients array
    const recipients = Array.isArray(data.recipients) ? data.recipients : [];
    
    console.log('Before update - Total recipients:', recipients.length);
    console.log('Looking for email:', email);
    
    // Find and update the specific recipient
    let found = false;
    const updatedRecipients = recipients.map(recipient => {
      if (recipient?.email && recipient.email.toLowerCase() === email.toLowerCase()) {
        console.log('Found recipient:', recipient.email, 'Updating groups to:', groups);
        found = true;
        return {
          ...recipient,
          groups: groups
        };
      }
      return recipient;
    });

    if (!found) {
      console.error('Recipient not found:', email);
      console.log('Available emails:', recipients.map(r => r?.email).filter(Boolean));
      return {
        code: 404,
        message: 'Recipient not found',
        error: 'Recipient email not found in the list'
      };
    }

    console.log('After update - Updated recipients:', updatedRecipients.length);

    // Update the document with the modified recipients array
    await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, recipientsDoc.id), {
      recipients: updatedRecipients,
      updatedAt: serverTimestamp()
    });

    console.log('Successfully updated recipient:', email);

    return {
      code: 777,
      message: 'Groups updated successfully',
      data: { email, groups }
    };
  } catch (error) {
    console.error('Error updating recipient groups:', error);
    return {
      code: 500,
      message: 'Failed to update groups',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Add this function to save groups list to Firebase
export async function saveGroupsToFirebase({ 
  userId, 
  groups 
}: { 
  userId: string; 
  groups: string[] 
}) {
  try {
    // Check if userId already has a groups document
    const q = query(collection(db, COLLECTION_GROUPS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_GROUPS_NAME, existingDoc.id), {
        groups: groups,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new document
      await addDoc(collection(db, COLLECTION_GROUPS_NAME), {
        userId: userId,
        groups: groups,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return {
      code: 777,
      message: 'Groups saved successfully',
      data: { groups }
    };
  } catch (error) {
    console.error('Error saving groups:', error);
    return {
      code: 500,
      message: 'Failed to save groups',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Add this function to fetch groups from Firebase
export async function fetchGroupsFromFirebase({ 
  userId 
}: { 
  userId: string 
}) {
  try {
    const q = query(collection(db, COLLECTION_GROUPS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const groupsDoc = querySnapshot.docs[0];
      const data = groupsDoc.data() as { groups?: string[] };
      return {
        code: 777,
        message: 'Groups fetched successfully',
        data: { groups: data.groups || [] }
      };
    } else {
      // Return default groups if none exist
      return {
        code: 777,
        message: 'No groups found, using defaults',
        data: { groups: ['VIP', 'Newsletter', 'Customers', 'Leads'] }
      };
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    return {
      code: 500,
      message: 'Failed to fetch groups',
      error: error instanceof Error ? error.message : String(error),
      data: { groups: ['VIP', 'Newsletter', 'Customers', 'Leads'] }
    };
  }
}

// Add this function to handle multiple recipient group updates in a single operation
export async function updateMultipleRecipientGroups({ 
  userId, 
  groupUpdates 
}: { 
  userId: string; 
  groupUpdates: Record<string, string[]>; // email -> groups array
}) {
  try {
    // Query to find the user's recipients document
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        code: 404,
        message: 'No recipients document found for user',
        error: 'Document not found'
      };
    }

    // Get the recipients document
    const recipientsDoc = querySnapshot.docs[0];
    const data = recipientsDoc.data() as { 
      recipients?: Array<{ name?: string; email?: string; groups?: string[] }>;
      rawText?: string;
      totalCount?: number;
    };
    
    // Get existing recipients array
    const recipients = Array.isArray(data.recipients) ? data.recipients : [];
    
    // Update all recipients in one pass
    const updatedRecipients = recipients.map(recipient => {
      if (recipient?.email && groupUpdates[recipient.email]) {
        return {
          ...recipient,
          groups: groupUpdates[recipient.email]
        };
      }
      return recipient;
    });

    // Update the document with the modified recipients array
    await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, recipientsDoc.id), {
      recipients: updatedRecipients,
      updatedAt: serverTimestamp()
    });

    return {
      code: 777,
      message: 'Groups updated successfully for multiple recipients',
      data: { updated: Object.keys(groupUpdates).length }
    };
  } catch (error) {
    console.error('Error updating multiple recipient groups:', error);
    return {
      code: 500,
      message: 'Failed to update groups',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Fetch user coins from Firebase
export async function fetchUserCoinsFromFirebase({ 
  userId 
}: { 
  userId: string 
}) {
  try {
    const q = query(collection(db, COLLECTION_COINS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const coinsDoc = querySnapshot.docs[0];
      const data = coinsDoc.data() as { coins?: number };
      return {
        code: 777,
        message: 'Coins fetched successfully',
        data: { coins: data.coins || 0 }
      };
    } else {
      // Create initial coins document with 0 coins
      await addDoc(collection(db, COLLECTION_COINS_NAME), {
        userId: userId,
        coins: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return {
        code: 777,
        message: 'Coins initialized',
        data: { coins: 0 }
      };
    }
  } catch (error) {
    console.error('Error fetching coins:', error);
    return {
      code: 500,
      message: 'Failed to fetch coins',
      error: error instanceof Error ? error.message : String(error),
      data: { coins: 0 }
    };
  }
}

// Purchase coins
export async function purchaseCoins({ 
  userId, 
  amount, 
  price, 
  packageInfo 
}: { 
  userId: string; 
  amount: number; 
  price: number; 
  packageInfo: string;
}) {
  try {
    // Get current coins
    const q = query(collection(db, COLLECTION_COINS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    let newBalance = amount;
    
    if (!querySnapshot.empty) {
      const coinsDoc = querySnapshot.docs[0];
      const data = coinsDoc.data() as { coins?: number };
      const currentCoins = data.coins || 0;
      newBalance = currentCoins + amount;

      // Update coins
      await updateDoc(doc(db, COLLECTION_COINS_NAME, coinsDoc.id), {
        coins: newBalance,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new coins document
      await addDoc(collection(db, COLLECTION_COINS_NAME), {
        userId: userId,
        coins: amount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Create transaction record
    await addDoc(collection(db, COLLECTION_TRANSACTIONS_NAME), {
      userId: userId,
      amount: amount,
      type: 'purchase',
      description: `Purchased ${packageInfo} for $${price}`,
      date: serverTimestamp(),
      status: 'completed',
      price: price,
      packageInfo: packageInfo
    });

    return {
      code: 777,
      message: 'Coins purchased successfully',
      data: { newBalance, amount }
    };
  } catch (error) {
    console.error('Error purchasing coins:', error);
    return {
      code: 500,
      message: 'Failed to purchase coins',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Fetch coin transactions
export async function fetchCoinTransactionsFromFirebase({ 
  userId 
}: { 
  userId: string 
}) {
  try {
    const q = query(
      collection(db, COLLECTION_TRANSACTIONS_NAME), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    }));

    // Sort by date descending
    transactions.sort((a , b ) => b.date.getTime() - a.date.getTime());

    return {
      code: 777,
      message: 'Transactions fetched successfully',
      data: { transactions }
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      code: 500,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : String(error),
      data: { transactions: [] }
    };
  }
}

// Use coins (deduct for sending emails)
export async function useCoins({ 
  userId, 
  amount, 
  description 
}: { 
  userId: string; 
  amount: number; 
  description: string;
}) {
  try {
    const q = query(collection(db, COLLECTION_COINS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        code: 404,
        message: 'No coins account found'
      };
    }

    const coinsDoc = querySnapshot.docs[0];
    const data = coinsDoc.data() as { coins?: number };
    const currentCoins = data.coins || 0;

    if (currentCoins < amount) {
      return {
        code: 400,
        message: 'Insufficient coins'
      };
    }

    const newBalance = currentCoins - amount;

    // Update coins
    await updateDoc(doc(db, COLLECTION_COINS_NAME, coinsDoc.id), {
      coins: newBalance,
      updatedAt: serverTimestamp()
    });

    // Create transaction record
    await addDoc(collection(db, COLLECTION_TRANSACTIONS_NAME), {
      userId: userId,
      amount: amount,
      type: 'usage',
      description: description,
      date: serverTimestamp(),
      status: 'completed'
    });

    return {
      code: 777,
      message: 'Coins used successfully',
      data: { newBalance, amount }
    };
  } catch (error) {
    console.error('Error using coins:', error);
    return {
      code: 500,
      message: 'Failed to use coins',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Create a purchase request (called from client payment page)
export async function createPurchaseRequest({ 
  userId, 
  userEmail,
  userName,
  amount, 
  packageInfo,
  packageId 
}: { 
  userId: string;
  userEmail: string;
  userName: string;
  amount: number; 
  packageInfo: string;
  packageId: string;
}) {
  try {
    // Create purchase request
    const requestData = {
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      amount: amount,
      packageInfo: packageInfo,
      packageId: packageId,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_PURCHASE_REQUESTS), requestData);

    return {
      code: 777,
      message: 'Purchase request submitted successfully. Awaiting admin approval.',
      data: { requestId: docRef.id }
    };
  } catch (error) {
    console.error('Error creating purchase request:', error);
    return {
      code: 500,
      message: 'Failed to create purchase request',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Get user's contact limit based on their subscription
export async function getUserContactLimit({ 
  userId 
}: { 
  userId: string 
}): Promise<{
  code: number;
  data?: {
    limit: number;
    currentCount: number;
    remaining: number;
    subscriptionStatus: string;
    canAddMore: boolean;
  };
  message: string;
}> {
  try {
    // Fetch user's subscription status
    const userDoc = await getDoc(doc(db, 'clients', userId));
    if (!userDoc.exists()) {
      return {
        code: 404,
        message: 'User not found'
      };
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData.subscriptionStatus || 'free';
    const limit = PACKAGE_LIMITS[subscriptionStatus as keyof typeof PACKAGE_LIMITS] || 500;

    // Fetch current recipient count
    let currentCount = 0;
    const recipientsDoc = await getDoc(doc(db, 'recipients', userId));
    if (recipientsDoc.exists()) {
      const recipientsData = recipientsDoc.data();
      currentCount = recipientsData.totalCount || 0;
    }

    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);
    const canAddMore = remaining > 0;

    return {
      code: 777,
      data: {
        limit,
        currentCount,
        remaining,
        subscriptionStatus,
        canAddMore
      },
      message: 'Contact limit fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user contact limit:', error);
    return {
      code: 500,
      message: 'Failed to fetch contact limit'
    };
  }
}

// Check if user can add specific number of recipients
export async function canAddRecipients({ 
  userId, 
  count 
}: { 
  userId: string; 
  count: number;
}): Promise<{
  code: number;
  data?: {
    canAdd: boolean;
    limit: number;
    currentCount: number;
    remaining: number;
    exceededBy?: number;
  };
  message: string;
}> {
  try {
    const limitResult = await getUserContactLimit({ userId });
    
    if (limitResult.code !== 777 || !limitResult.data) {
      return {
        code: limitResult.code,
        message: limitResult.message
      };
    }

    const { limit, currentCount, remaining } = limitResult.data;
    const canAdd = remaining >= count;
    const exceededBy = canAdd ? 0 : count - remaining;

    return {
      code: 777,
      data: {
        canAdd,
        limit,
        currentCount,
        remaining,
        exceededBy
      },
      message: canAdd 
        ? 'Can add recipients' 
        : `Cannot add ${count} recipients. Exceeds limit by ${exceededBy}.`
    };
  } catch (error) {
    console.error('Error checking if can add recipients:', error);
    return {
      code: 500,
      message: 'Failed to check recipient limit'
    };
  }
}

// Updated uploadRecipientsToFirebase with limit checking
export const uploadRecipientsToFirebaseWithLimit = async ({
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
    // First check if user can add these recipients
    const limitCheck = await canAddRecipients({ userId, count: totalCount });
    
    if (limitCheck.code !== 777 || !limitCheck.data?.canAdd) {
      return {
        code: 403,
        message: limitCheck.message + ` Please upgrade your package to add more contacts.`
      };
    }

    // If limit check passes, proceed with the original upload logic
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const data = existingDoc.data() as { recipients?: Array<{ name?: string; email?: string }>; rawText?: string; totalCount?: number };
      const existingList = Array.isArray(data.recipients) ? data.recipients as Array<{ name?: string; email?: string }> : [];

      const incoming = Array.isArray(recipients) ? recipients.filter(r => r && r.email).map(r => ({ name: r.name ?? '', email: String(r.email).trim() })) : [];

      const existingMap = new Map<string, { name?: string; email: string }>();
      for (const r of existingList) {
        if (!r?.email) continue;
        existingMap.set(String(r.email).toLowerCase(), { name: r.name, email: String(r.email) });
      }

      let addedCount = 0;
      for (const inc of incoming) {
        const key = inc.email.toLowerCase();
        if (!existingMap.has(key)) {
          existingMap.set(key, { name: inc.name || '', email: inc.email });
          addedCount++;
        }
      }

      const merged = Array.from(existingMap.values());

      // Final check: ensure merged total doesn't exceed limit
      const finalCheck = await canAddRecipients({ userId, count: merged.length - existingList.length });
      if (finalCheck.code !== 777 || !finalCheck.data?.canAdd) {
        return {
          code: 403,
          message: `Cannot add recipients. Would exceed contact limit.`
        };
      }

      await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, existingDoc.id), {
        recipients: merged,
        totalCount: merged.length,
        rawText: merged.map(r => r.email).join('\n'),
        updatedAt: serverTimestamp()
      });

      return { code: 777, message: `Recipients updated — ${addedCount} new added.`, added: addedCount };
    } else {
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
    console.error('uploadRecipientsToFirebaseWithLimit error:', error);
    return { code: 101, message };
  }
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random password for OTP users
function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16) + Date.now().toString(36);
}

// Store OTP in Firestore
export const createOTP = async ({ 
  email 
}: { 
  email: string 
}): Promise<{ code: number; message: string; otp?: string }> => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Delete any existing OTPs for this email
    const q = query(collection(db, COLLECTION_OTP_NAME), where('email', '==', email));
    const existingOTPs = await getDocs(q);
    
    for (const doc of existingOTPs.docs) {
      await deleteDoc(doc.ref);
    }

    // Create new OTP document
    await addDoc(collection(db, COLLECTION_OTP_NAME), {
      email: email,
      otp: otp,
      expiresAt: expiresAt.toISOString(),
      createdAt: serverTimestamp(),
      verified: false
    });

    return { 
      code: 777, 
      message: 'OTP created successfully',
      otp: otp 
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('createOTP error:', error);
    return { code: 101, message };
  }
}

// Verify OTP
export const verifyOTP = async ({ 
  email, 
  otp 
}: { 
  email: string; 
  otp: string 
}): Promise<{ code: number; message: string; isNewUser?: boolean }> => {
  try {
    // Find OTP document for this email
    const q = query(
      collection(db, COLLECTION_OTP_NAME), 
      where('email', '==', email),
      where('otp', '==', otp),
      where('verified', '==', false)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { code: 404, message: 'Invalid or expired OTP' };
    }

    const otpDoc = querySnapshot.docs[0];
    const otpData = otpDoc.data();
    
    // Check if OTP has expired
    const expiresAt = new Date(otpData.expiresAt);
    if (expiresAt < new Date()) {
      await deleteDoc(otpDoc.ref);
      return { code: 401, message: 'OTP has expired' };
    }

    // Check if user exists
    const userQuery = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    const isNewUser = userSnapshot.empty;

    // Mark OTP as verified
    await updateDoc(otpDoc.ref, {
      verified: true,
      verifiedAt: serverTimestamp()
    });

    // Clean up - delete the OTP after verification
    await deleteDoc(otpDoc.ref);

    return { 
      code: 777, 
      message: 'OTP verified successfully',
      isNewUser: isNewUser
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('verifyOTP error:', error);
    return { code: 101, message };
  }
}

// Create user account after OTP verification (for new users)
export const createUserWithOTP = async ({ 
  email, 
  displayName 
}: { 
  email: string; 
  displayName?: string 
}): Promise<{ code: number; message: string; uid?: string }> => {
  try {
    // Check if user already exists in Firestore
    const userQuery = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      return { code: 400, message: 'User already exists' };
    }

    // Generate a random password for Firebase Auth
    const randomPassword = generateRandomPassword();
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, randomPassword);
    const user = userCredential.user;

    // Hash the random password for storage
    const hashedPassword = await hashPassword(randomPassword);

    // Create user document in Firestore with the Firebase Auth UID
    await setDoc(doc(db, COLLECTIONS_CLIENTS, user.uid), {
      email: email,
      displayName: displayName || '',
      hashedPassword: hashedPassword, // Store hashed random password
      createdAt: serverTimestamp(),
      role: 'customer',
      authMethod: 'otp',
      otpPassword: randomPassword // Store plaintext temporarily (will be used for auto-login)
    });

    // Automatically sign in the user
    await firebaseSignIn(auth, email, randomPassword);

    return { 
      code: 777, 
      message: 'Account created successfully',
      uid: user.uid
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('createUserWithOTP error:', error);
    return { code: 101, message };
  }
}

// Sign in existing OTP user
export const signInOTPUser = async ({ 
  email 
}: { 
  email: string 
}): Promise<{ code: number; message: string; uid?: string }> => {
  try {
    // Get user from Firestore
    const userQuery = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return { code: 404, message: 'User not found' };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Get the stored OTP password
    const otpPassword = userData.otpPassword;
    
    if (!otpPassword) {
      // If no OTP password stored, user might have used traditional signup
      return { code: 400, message: 'Please use password login for this account' };
    }

    // Sign in with the stored password
    const userCredential = await firebaseSignIn(auth, email, otpPassword);
    
    return { 
      code: 777, 
      message: 'Signed in successfully',
      uid: userCredential.user.uid
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('signInOTPUser error:', error);
    return { code: 101, message };
  }
}

// Get user by email (for checking if user exists)
export const getUserByEmail = async ({ 
  email 
}: { 
  email: string 
}): Promise<{ code: number; message: string; uid?: string; userData?: Record<string, unknown> }> => {
  try {
    const userQuery = query(collection(db, COLLECTIONS_CLIENTS), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return { code: 404, message: 'User not found' };
    }

    const userDoc = userSnapshot.docs[0];
    return { 
      code: 777, 
      message: 'User found',
      uid: userDoc.id,
      userData: userDoc.data()
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('getUserByEmail error:', error);
    return { code: 101, message };
  }
}

// Log admin login attempt
export const logAdminLogin = async ({
  adminEmail,
  status,
  failureReason,
  ipAddress,
  userAgent,
  location
}: {
  adminEmail: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}): Promise<{ code: number; message: string }> => {
  try {
    await addDoc(collection(db, COLLECTION_ADMIN_LOGS_NAME), {
      adminEmail,
      status,
      failureReason: failureReason || null,
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown',
      location: location || 'Unknown',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    return { code: 777, message: 'Login logged successfully' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('logAdminLogin error:', error);
    return { code: 101, message };
  }
};

// Fetch admin login logs
export const fetchAdminLoginLogs = async ({
  limitCount = 100,
  adminEmail
}: {
  limitCount?: number;
  adminEmail?: string;
} = {}): Promise<{
  code: number;
  data?: AdminLoginLog[];
  message: string;
}> => {
  try {
    let q;
    
    if (adminEmail) {
      q = query(
        collection(db, COLLECTION_ADMIN_LOGS_NAME),
        where('adminEmail', '==', adminEmail),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, COLLECTION_ADMIN_LOGS_NAME),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    
    const logs: AdminLoginLog[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        adminEmail: data.adminEmail,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        status: data.status,
        failureReason: data.failureReason,
        timestamp: data.timestamp?.toDate() || new Date(data.createdAt),
        sessionDuration: data.sessionDuration
      };
    });

    return {
      code: 777,
      data: logs,
      message: 'Logs fetched successfully'
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('fetchAdminLoginLogs error:', error);
    return { code: 101, message };
  }
};

// Get login statistics
export const getAdminLoginStats = async (): Promise<{
  code: number;
  data?: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueAdmins: number;
    recentActivity: number; // Last 24 hours
  };
  message: string;
}> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_ADMIN_LOGS_NAME));
    
    const logs = querySnapshot.docs.map(doc => doc.data());
    const totalLogins = logs.length;
    const successfulLogins = logs.filter(log => log.status === 'success').length;
    const failedLogins = logs.filter(log => log.status === 'failed').length;
    const uniqueAdmins = new Set(logs.map(log => log.adminEmail)).size;
    
    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentActivity = logs.filter(log => {
      const logDate = log.timestamp?.toDate?.() || new Date(log.createdAt);
      return logDate >= yesterday;
    }).length;

    return {
      code: 777,
      data: {
        totalLogins,
        successfulLogins,
        failedLogins,
        uniqueAdmins,
        recentActivity
      },
      message: 'Stats fetched successfully'
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('getAdminLoginStats error:', error);
    return { code: 101, message };
  }
};

// Helper function to get user's IP and location (client-side)
export const getUserLocationData = async (): Promise<{
  ipAddress: string;
  location: string;
  userAgent: string;
}> => {
  try {
    // Get IP and location from ipapi.co
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      ipAddress: data.ip || 'Unknown',
      location: `${data.city}, ${data.country_name}` || 'Unknown',
      userAgent: navigator.userAgent || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching location data:', error);
    return {
      ipAddress: 'Unknown',
      location: 'Unknown',
      userAgent: navigator.userAgent || 'Unknown'
    };
  }
};

// Log client login attempt
export const logClientLogin = async ({
  userEmail,
  status,
  failureReason,
  ipAddress,
  userAgent,
  location
}: {
  userEmail: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}): Promise<{ code: number; message: string; logId?: string }> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_CLIENT_LOGS_NAME), {
      userEmail,
      status,
      failureReason: failureReason || null,
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown',
      location: location || 'Unknown',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    return { code: 777, message: 'Login logged successfully', logId: docRef.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('logClientLogin error:', error);
    return { code: 101, message };
  }
};

export const fetchClientLoginLogs = async ({
  userEmail,
  limitCount = 10
}: {
  userEmail: string;
  limitCount?: number;
}): Promise<{
  code: number;
  data?: ClientLoginLog[];
  message: string;
}> => {
  try {
    // Fetch all logs for the user WITHOUT ordering (to avoid index requirement)
    const q = query(
      collection(db, COLLECTION_CLIENT_LOGS_NAME),
      where('userEmail', '==', userEmail)
    );

    const querySnapshot = await getDocs(q);
    
    // Sort in memory instead of using Firestore ordering
    const logs: ClientLoginLog[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          userEmail: data.userEmail,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
          status: data.status,
          failureReason: data.failureReason,
          timestamp: data.timestamp?.toDate() || new Date(data.createdAt),
          sessionDuration: data.sessionDuration
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort newest first
      .slice(0, limitCount); // Limit results

    return {
      code: 777,
      data: logs,
      message: 'Logs fetched successfully'
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('fetchClientLoginLogs error:', error);
    return { code: 101, message };
  }
};

// Get client login statistics
export const getClientLoginStats = async ({ 
  userEmail 
}: { 
  userEmail: string 
}): Promise<{
  code: number;
  data?: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    recentActivity: number; // Last 7 days
    lastSuccessfulLogin?: Date;
  };
  message: string;
}> => {
  try {
    const q = query(
      collection(db, COLLECTION_CLIENT_LOGS_NAME),
      where('userEmail', '==', userEmail)
    );
    const querySnapshot = await getDocs(q);
    
    const logs = querySnapshot.docs.map(doc => doc.data());
    const totalLogins = logs.filter(log => log.status === 'success' || log.status === 'failed').length;
    const successfulLogins = logs.filter(log => log.status === 'success').length;
    const failedLogins = logs.filter(log => log.status === 'failed').length;
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = logs.filter(log => {
      const logDate = log.timestamp?.toDate?.() || new Date(log.createdAt);
      return logDate >= sevenDaysAgo;
    }).length;

    // Last successful login
    const successfulLoginLogs = logs
      .filter(log => log.status === 'success')
      .map(log => ({
        ...log,
        timestamp: log.timestamp?.toDate?.() || new Date(log.createdAt)
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const lastSuccessfulLogin = successfulLoginLogs.length > 0 
      ? successfulLoginLogs[0].timestamp 
      : undefined;

    return {
      code: 777,
      data: {
        totalLogins,
        successfulLogins,
        failedLogins,
        recentActivity,
        lastSuccessfulLogin
      },
      message: 'Stats fetched successfully'
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('getClientLoginStats error:', error);
    return { code: 101, message };
  }
};

// Update signUpWithGoogleAccount to return email
export const signUpWithGoogleAccount = async () : Promise<{code: number, message: string, uid?: string, email?: string, errorCode?: string | null}> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, COLLECTIONS_CLIENTS, user.uid), {
      email: user.email,
      displayName: user.displayName || '',
      hashedPassword: null,
      createdAt: serverTimestamp(),
      role: 'customer'
    });

    return { code: 777, message: 'signed up successfully.', uid: user.uid, email: user.email || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string } | undefined)?.code ?? null;
    console.error('signUpWithGoogleAccount error:', error);
    return { code: 101, message, errorCode };
  }
}

// Create payment record
export async function createPaymentRecord({
  userId,
  userEmail,
  userName,
  amount,
  coins,
  packageId,
  packageInfo,
  paymentMethod,
  mpesaPhone,
  cardLast4,
  cardBrand
}: {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  coins: number;
  packageId: string;
  packageInfo: string;
  paymentMethod: 'mpesa' | 'card';
  mpesaPhone?: string;
  cardLast4?: string;
  cardBrand?: string;
}): Promise<{ code: number; message: string; paymentId?: string }> {
  try {
    const paymentData = {
      userId,
      userEmail,
      userName,
      amount,
      coins,
      packageId,
      packageInfo,
      paymentMethod,
      paymentStatus: 'pending',
      mpesaPhone: mpesaPhone || null,
      cardLast4: cardLast4 || null,
      cardBrand: cardBrand || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_PAYMENTS), paymentData);

    return {
      code: 777,
      message: 'Payment record created successfully',
      paymentId: docRef.id
    };
  } catch (error) {
    console.error('Error creating payment record:', error);
    return {
      code: 500,
      message: 'Failed to create payment record',
    };
  }
}

// Update payment status
export async function updatePaymentStatus({
  paymentId,
  status,
  transactionRef,
  mpesaCheckoutRequestId,
  paymentDetails
}: {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionRef?: string;
  mpesaCheckoutRequestId?: string;
  paymentDetails?: Record<string, unknown>;
}): Promise<{ code: number; message: string }> {
  try {
    // Respect system setting: if auto-approve is disabled, treat completed as pending
    let finalStatus = status;
    try {
      const { fetchSystemSettings } = await import('./firebase-operations');
      const settingsResult = await fetchSystemSettings();
      const autoApprove = settingsResult.data?.autoApprovePayments === true;

      if (status === 'completed' && !autoApprove) {
        // When admin requires manual approval, do not mark as completed automatically
        finalStatus = 'pending';
        paymentDetails = {
          ...(paymentDetails || {}),
          awaitingAdminApproval: true
        };
        console.log('updatePaymentStatus: auto-approve disabled — storing as pending and flagging awaitingAdminApproval');
      }

      // If a transaction failed and admin requires manual approval, skip saving failed transactions
      if (status === 'failed' && !autoApprove) {
        console.log('updatePaymentStatus: auto-approve disabled — skipping saving failed payment for', paymentId);
        return { code: 777, message: 'Skipped saving failed payment due to manual approval setting' };
      }
    } catch (err) {
      console.warn('updatePaymentStatus: could not load system settings, proceeding with provided status', err);
    }

    const updates: Record<string, unknown> = {
      paymentStatus: finalStatus,
      updatedAt: serverTimestamp()
    };

    if (transactionRef) updates.transactionRef = transactionRef;
    if (mpesaCheckoutRequestId) updates.mpesaCheckoutRequestId = mpesaCheckoutRequestId;
    if (paymentDetails) updates.paymentDetails = paymentDetails;

    await updateDoc(doc(db, COLLECTION_PAYMENTS, paymentId), updates);

    return {
      code: 777,
      message: 'Payment status updated successfully'
    };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return {
      code: 500,
      message: 'Failed to update payment status'
    };
  }
}

// Fetch all payments (for admin)
export async function fetchAllPayments(): Promise<{
  code: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: { payments: any[] }; 
  message: string;
}> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_PAYMENTS));

    const payments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      code: 777,
      data: { payments },
      message: 'Payments fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return {
      code: 500,
      message: 'Failed to fetch payments',
      data: { payments: [] }
    };
  }
}

// Fetch user payments
export async function fetchUserPayments({
  userId
}: {
  userId: string;
}): Promise<{
  code: number;
  data?: { payments: Record<string, unknown>[] };
  message: string;
}> {
  try {
    const q = query(
      collection(db, COLLECTION_PAYMENTS),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const payments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || '',
        userEmail: data.userEmail || '',
        userName: data.userName || '',
        amount: data.amount || 0,
        coins: data.coins || 0,
        packageId: data.packageId || '',
        packageInfo: data.packageInfo || '',
        paymentMethod: data.paymentMethod || 'mpesa',
        paymentStatus: data.paymentStatus || 'pending',
        transactionRef: data.transactionRef || '',
        mpesaPhone: data.mpesaPhone || '',
        mpesaCheckoutRequestId: data.mpesaCheckoutRequestId || '',
        manuallyVerified: data.manuallyVerified || false,
        paymentDetails: data.paymentDetails || {},
        mpesaCompletedAt: data.mpesaCompletedAt || null,
        approvedAt: data.approvedAt?.toDate() || null,
        rejectionReason: data.rejectionReason || null,
      };
    }) as Record<string, unknown>[];


    return {
      code: 777,
      data: { payments },
      message: 'User payments fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return {
      code: 500,
      message: 'Failed to fetch user payments',
      data: { payments: [] }
    };
  }
}

// Approve payment and allocate coins (admin action)
export async function approvePayment({
  paymentId,
  userId,
  coins,
  packageId,
  packageInfo
}: {
  paymentId: string;
  userId: string;
  coins: number;
  packageId: string;
  packageInfo: string;
}): Promise<{ code: number; message: string }> {
  try {
    console.log('approvePayment called with:', { paymentId, userId, coins, packageId, packageInfo });
    // Get payment details to ensure it exists and is pending
    const paymentDoc = await getDoc(doc(db, COLLECTION_PAYMENTS, paymentId));
    
    if (!paymentDoc.exists()) {
      console.warn('approvePayment: payment not found for id', paymentId);
      return {
        code: 404,
        message: 'Payment not found'
      };
    }

    const paymentData = paymentDoc.data();
    console.log('approvePayment: paymentData.paymentStatus =', paymentData.paymentStatus);
    
    if (paymentData.paymentStatus === 'completed') {
      console.warn('approvePayment: payment already completed, cannot approve again', paymentId);
      return {
        code: 400,
        message: 'Payment already approved and coins credited'
      };
    }

    // Get current coins balance
    const coinsQuery = query(collection(db, COLLECTION_COINS_NAME), where('userId', '==', userId));
    const coinsSnapshot = await getDocs(coinsQuery);

    let newBalance = coins;
    
    if (!coinsSnapshot.empty) {
      // Update existing coins document
      const coinsDoc = coinsSnapshot.docs[0];
      const currentCoins = coinsDoc.data().coins || 0;
      newBalance = currentCoins + coins;

      await updateDoc(doc(db, COLLECTION_COINS_NAME, coinsDoc.id), {
        coins: newBalance,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new coins document
      await addDoc(collection(db, COLLECTION_COINS_NAME), {
        userId: userId,
        coins: coins,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Update user's subscription in clients collection
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Fetch current client data to handle top-ups correctly
    const clientDoc = await getDoc(doc(db, 'clients', userId));
    const clientData = clientDoc.exists() ? clientDoc.data() as any : {};

    const currentTotal = clientData?.totalEmailsAllowed || 0;
    const currentRemaining = clientData?.emailsRemaining || 0;

    // For top-ups: add coins to existing email allowances instead of overwriting
    const newTotal = currentTotal + coins;
    const newRemaining = currentRemaining + coins;

    await updateDoc(doc(db, 'clients', userId), {
      subscriptionStatus: packageId,
      subscriptionExpiry: expiryDate.toISOString().split('T')[0],
      totalEmailsAllowed: newTotal,
      emailsRemaining: newRemaining,
      updatedAt: serverTimestamp(),
    });

    // Create transaction record
    await addDoc(collection(db, COLLECTION_TRANSACTIONS_NAME), {
      userId: userId,
      amount: coins,
      type: 'purchase',
      description: `M-Pesa payment approved by admin - ${packageInfo}`,
      date: serverTimestamp(),
      status: 'completed',
      packageInfo: packageInfo,
      price: paymentData.amount,
      transactionRef: paymentData.transactionRef || paymentData.paymentDetails?.mpesaReceiptNumber,
    });

    // Update payment status to completed
    await updateDoc(doc(db, COLLECTION_PAYMENTS, paymentId), {
      paymentStatus: 'completed',
      approvedAt: serverTimestamp(),
      approvedBy: 'admin', // You can pass admin email if available
      updatedAt: serverTimestamp(),
    });

    return {
      code: 777,
      message: `Payment approved successfully. ${coins} coins credited to user.`
    };
  } catch (error) {
    console.error('Error approving payment:', error);
    return {
      code: 500,
      message: 'Failed to approve payment: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

export async function rejectPayment({
  paymentId,
  rejectionReason
}: {
  paymentId: string;
  rejectionReason?: string;
}): Promise<{ code: number; message: string }> {
  try {
    // Fetch payment to determine if coins were already credited
    const paymentDoc = await getDoc(doc(db, COLLECTION_PAYMENTS, paymentId));
    if (!paymentDoc.exists()) {
      return { code: 404, message: 'Payment not found' };
    }

    const paymentData: any = paymentDoc.data();

    // If payment was completed (coins credited), reverse the coins
    if (paymentData.paymentStatus === 'completed') {
      try {
        const userId = paymentData.userId;
        const coinsToRevert = paymentData.coins || 0;

        if (userId && coinsToRevert > 0) {
          // Update coins collection: subtract coins (not below 0)
          const coinsQuery = query(collection(db, COLLECTION_COINS_NAME), where('userId', '==', userId));
          const coinsSnapshot = await getDocs(coinsQuery);
          if (!coinsSnapshot.empty) {
            const coinsDoc = coinsSnapshot.docs[0];
            const current = (coinsDoc.data().coins || 0) as number;
            const newBalance = Math.max(0, current - coinsToRevert);
            await updateDoc(doc(db, COLLECTION_COINS_NAME, coinsDoc.id), {
              coins: newBalance,
              updatedAt: serverTimestamp()
            });
          }

          // Update clients document: subtract from totals
          const clientRef = doc(db, 'clients', userId);
          const clientDoc = await getDoc(clientRef);
          if (clientDoc.exists()) {
            const c = clientDoc.data() as any;
            const totalEmailsAllowed = Math.max(0, (c.totalEmailsAllowed || 0) - coinsToRevert);
            const emailsRemaining = Math.max(0, (c.emailsRemaining || 0) - coinsToRevert);
            await updateDoc(clientRef, {
              totalEmailsAllowed,
              emailsRemaining,
              updatedAt: serverTimestamp()
            });
          }

          // Create a reversal transaction record
          await addDoc(collection(db, COLLECTION_TRANSACTIONS_NAME), {
            userId,
            amount: -coinsToRevert,
            type: 'reversal',
            description: `Reversal for rejected payment ${paymentId}`,
            date: serverTimestamp(),
            status: 'completed',
            packageInfo: paymentData.packageInfo || '',
            transactionRef: paymentData.transactionRef || paymentData.paymentDetails?.mpesaReceiptNumber || null
          });
        }
      } catch (err) {
        console.error('Error reversing coins during rejection:', err);
      }
    }

    // Finally mark payment rejected (include reason)
    await updateDoc(doc(db, COLLECTION_PAYMENTS, paymentId), {
      paymentStatus: 'rejected',
      rejectionReason: rejectionReason || 'Rejected by admin',
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      code: 777,
      message: 'Payment rejected successfully'
    };
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return {
      code: 500,
      message: 'Failed to reject payment'
    };
  }
}

export async function fetchSystemSettings(): Promise<{
  code: number;
  data?: SystemSettings;
  message: string;
}> {
  try {
    const settingsDoc = await getDoc(doc(db, COLLECTION_SYSTEM_SETTINGS, SYSTEM_SETTINGS_DOC_ID));
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as SystemSettings;
      return {
        code: 777,
        data: {
          maxRecipientsPerCampaign: data.maxRecipientsPerCampaign || 2000,
          registrationEnabled: data.registrationEnabled !== false,
          autoApprovePayments: data.autoApprovePayments === true ? true : false
        },
        message: 'Settings fetched successfully'
      };
    } else {
      const defaultSettings: SystemSettings = {
        maxRecipientsPerCampaign: 2000,
        registrationEnabled: true,
        autoApprovePayments: false
      };
      return {
        code: 777,
        data: defaultSettings,
        message: 'Default settings returned'
      };
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {
      code: 500,
      message: 'Failed to fetch system settings'
    };
  }
}

export async function saveSystemSettings({
  settings
}: {
  settings: SystemSettings;
}): Promise<{ code: number; message: string }> {
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM_SETTINGS, SYSTEM_SETTINGS_DOC_ID), {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return {
      code: 777,
      message: 'Settings saved successfully'
    };
  } catch (error) {
    console.error('Error saving system settings:', error);
    return {
      code: 500,
      message: 'Failed to save system settings'
    };
  }
}

export async function deleteOldCampaigns(): Promise<{
  code: number;
  message: string;
  deletedCount?: number;
}> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const campaignsSnapshot = await getDocs(collection(db, COLLECTION_CAMPAIGNS_NAME));
    let deletedCount = 0;

    for (const campaignDoc of campaignsSnapshot.docs) {
      const data = campaignDoc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(0);
      
      if (createdAt < ninetyDaysAgo) {
        await deleteDoc(campaignDoc.ref);
        deletedCount++;
      }
    }

    return {
      code: 777,
      message: `Successfully deleted ${deletedCount} old campaign(s)`,
      deletedCount
    };
  } catch (error) {
    console.error('Error deleting old campaigns:', error);
    return {
      code: 500,
      message: 'Failed to delete old campaigns'
    };
  }
}

export async function exportAllData(): Promise<{
  code: number;
  data?: {
    users: unknown[];
    campaigns: unknown[];
    recipients: unknown[];
    transactions: unknown[];
    payments: unknown[];
    exportDate: string;
  };
  message: string;
}> {
  try {
    const [usersSnap, campaignsSnap, recipientsSnap, transactionsSnap, paymentsSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS_CLIENTS)),
      getDocs(collection(db, COLLECTION_CAMPAIGNS_NAME)),
      getDocs(collection(db, COLLECTION_RECIPIENTS_NAME)),
      getDocs(collection(db, COLLECTION_TRANSACTIONS_NAME)),
      getDocs(collection(db, COLLECTION_PAYMENTS))
    ]);

    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const campaigns = campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const recipients = recipientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      code: 777,
      data: {
        users,
        campaigns,
        recipients,
        transactions,
        payments,
        exportDate: new Date().toISOString()
      },
      message: 'Data exported successfully'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return {
      code: 500,
      message: 'Failed to export data'
    };
  }
}

// Delete admin login logs older than 7 days (keeps only current week)
export async function deleteOldAdminLogs({
  daysOld = 7
}: {
  daysOld?: number;
} = {}): Promise<{
  code: number;
  message: string;
  deletedCount?: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const logsSnapshot = await getDocs(collection(db, COLLECTION_ADMIN_LOGS_NAME));
    let deletedCount = 0;

    const deletePromises = [];
    
    for (const logDoc of logsSnapshot.docs) {
      const data = logDoc.data();
      const logDate = data.timestamp?.toDate?.() || new Date(data.createdAt);
      
      if (logDate < cutoffDate) {
        deletePromises.push(deleteDoc(logDoc.ref));
        deletedCount++;
      }
    }

    // Delete all old logs in parallel for better performance
    await Promise.all(deletePromises);

    return {
      code: 777,
      message: `Successfully deleted ${deletedCount} old log(s)`,
      deletedCount
    };
  } catch (error) {
    console.error('Error deleting old admin logs:', error);
    return {
      code: 500,
      message: 'Failed to delete old admin logs'
    };
  }
}

// Also add a similar function for client logs
export async function deleteOldClientLogs({
  daysOld = 7
}: {
  daysOld?: number;
} = {}): Promise<{
  code: number;
  message: string;
  deletedCount?: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const logsSnapshot = await getDocs(collection(db, COLLECTION_CLIENT_LOGS_NAME));
    let deletedCount = 0;

    const deletePromises = [];
    
    for (const logDoc of logsSnapshot.docs) {
      const data = logDoc.data();
      const logDate = data.timestamp?.toDate?.() || new Date(data.createdAt);
      
      if (logDate < cutoffDate) {
        deletePromises.push(deleteDoc(logDoc.ref));
        deletedCount++;
      }
    }

    await Promise.all(deletePromises);

    return {
      code: 777,
      message: `Successfully deleted ${deletedCount} old client log(s)`,
      deletedCount
    };
  } catch (error) {
    console.error('Error deleting old client logs:', error);
    return {
      code: 500,
      message: 'Failed to delete old client logs'
    };
  }
}

export async function deleteOldPayments({
  monthsOld = 1
}: {
  monthsOld?: number;
} = {}): Promise<{
  code: number;
  message: string;
  deletedCount?: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    let deletedCount = 0;

    const deletePromises = [];
    
    for (const paymentDoc of paymentsSnapshot.docs) {
      const data = paymentDoc.data();
      const paymentDate = data.mpesaCompletedAt?.toDate?.() || 
                         data.approvedAt?.toDate?.() || 
                         data.createdAt?.toDate?.() ||
                         new Date(data.createdAt);
      
      if (paymentDate < cutoffDate) {
        deletePromises.push(deleteDoc(paymentDoc.ref));
        deletedCount++;
      }
    }

    await Promise.all(deletePromises);

    return {
      code: 777,
      message: `Successfully deleted ${deletedCount} old payment(s) (${monthsOld} month${monthsOld > 1 ? 's' : ''} old)`,
      deletedCount
    };
  } catch (error) {
    console.error('Error deleting old payments:', error);
    return {
      code: 500,
      message: 'Failed to delete old payments'
    };
  }
}