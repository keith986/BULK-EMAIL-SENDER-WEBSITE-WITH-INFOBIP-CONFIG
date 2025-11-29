import { addDoc, setDoc, collection, doc, getDocs, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import {db} from '../_lib/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword as firebaseSignIn } from "firebase/auth";
import { auth } from '../_lib/firebase';
import { hashPassword, verifyPassword } from './hash-password';

const COLLECTION_API_NAME = "apikeys";
const COLLECTION_BATCH_NAME = "batchsettings";
const COLLECTION_RECIPIENTS_NAME = "recipients";
const COLLECTIONS_CLIENTS = "clients";

// Represent the stored hashed password format we save in Firestore
type StoredHashedPassword = {
  salt: string;
  iterations: number;
  hash: string;
};

type ClientDocument = {
  email?: string | null;
  displayName?: string | null;
  hashedPassword?: StoredHashedPassword | null;
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
}): Promise<{code: number, message: string}> => {
  try {
    // Check if userId already exists
    const q = query(collection(db, COLLECTION_RECIPIENTS_NAME), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User already exists, update the existing document
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTION_RECIPIENTS_NAME, existingDoc.id), {
        recipients: recipients,
        totalCount: totalCount,
        rawText: rawText,
        updatedAt: serverTimestamp()
      });
      
      return { code: 777, message: 'Recipients list has been updated successfully.' };
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
      return { code: 777, message: 'Recipients list has been saved successfully.' };
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


