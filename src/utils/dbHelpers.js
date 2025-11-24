import { db } from '../config/firebase';
import { ref, get, update, push } from 'firebase/database';

export async function getData(path) {
  try {
    const snapshot = await get(ref(db, path));
    if (!snapshot.exists()) return null;
    return snapshot.val();
  } catch (err) {
    console.error('getData error:', path, err);
    throw err;
  }
}

export async function updateData(path, payload) {
  try {
    await update(ref(db, path), payload);
    return true;
  } catch (err) {
    console.error('updateData error:', path, payload, err);
    throw err;
  }
}

export async function pushData(path, payload) {
  try {
    const newRef = await push(ref(db, path), payload);
    return newRef.key;
  } catch (err) {
    console.error('pushData error:', path, payload, err);
    throw err;
  }
}
