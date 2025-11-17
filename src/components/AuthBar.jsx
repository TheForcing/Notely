import React from 'react';
import useAuth from '../hooks/useAuth';

export default function AuthBar(){
  const { user, signInWithGoogle, logout } = useAuth();
  return (
    <div className="flex items-center justify-between gap-3">
      {user ? (
        <>
          <div className="text-sm">{user.email}</div>
          <button onClick={logout} className="px-2 py-1 text-sm border rounded">Logout</button>
        </>
      ) : (
        <button onClick={signInWithGoogle} className="px-2 py-1 text-sm border rounded">Sign in with Google</button>
      )}
    </div>
  );
}
