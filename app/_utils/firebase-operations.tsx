import { addDoc, collection, doc, getDocs, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import {db} from '../_lib/firebase.tsx'

const COLLECTION_API_NAME = "apikeys";
const COLLECTION_BATCH_NAME = "batchsettings";
const COLLECTION_RECIPIENTS_NAME = "recipients";

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
  } catch (err: any) {
    return { code: 101, message: err.message };
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
  } catch (err: any) {
    return { code: 101, message: err.message };
  }
}

/*
export const  uploadEmailAddressesToFirebase = async ({data: any}) => {
    try{
        const emailData = {
            userId: data.userId,
            records: data.map((address) => address)
        }
        await addDoc(collection(db, COLLECTION_NAME), emailData)
        return {code: 777, message: 'Uploaded successfully.'};
    }catch(err){
        return {code: 101, message: err.message}
    }
}

export const fetchApiDataFromFirebase = async ({data: string}) => {
    try{
    const userRef = doc(db, COLLECTION_NAME, data.userId)
    const snapData = await getDoc(collection(userRef));
    if(snapData.exists()){
        return {code: 777, userdata : snapData.data(), message: "document found"}
    }else{
        return {code: 777, message: "no such document!"}
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
  } catch (err: any) {
    return { code: 101, message: err.message };
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
  } catch (err: any) {
    return { code: 101, message: err.message };
  }
}




