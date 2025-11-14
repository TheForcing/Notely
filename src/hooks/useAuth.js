// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };
  const logout = async () => await signOut(auth);
  const signInEmail = (email, pw) =>
    signInWithEmailAndPassword(auth, email, pw);
  const signUpEmail = (email, pw) =>
    createUserWithEmailAndPassword(auth, email, pw);

  return { user, signInWithGoogle, logout, signInEmail, signUpEmail };
}
