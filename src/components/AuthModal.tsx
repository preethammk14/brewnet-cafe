import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, LogOut, CheckCircle, AlertTriangle, Copy, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
}

interface AuthErrorInfo {
  title: string;
  message: string;
  code?: string;
  domainToCopy?: string;
  isDomainError?: boolean;
  isProviderError?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const parseAuthError = (err: any): AuthErrorInfo => {
    const code = err?.code || '';
    const rawMsg = err?.message || '';

    if (code === 'auth/unauthorized-domain') {
      return {
        title: 'Domain Not Authorized in Firebase',
        message: `The domain "${currentDomain}" is not in the list of Authorized Domains for your Firebase project "brewnest-cafe".`,
        code,
        domainToCopy: currentDomain,
        isDomainError: true,
      };
    }

    if (code === 'auth/operation-not-allowed') {
      return {
        title: 'Sign-In Method Disabled',
        message: 'This sign-in provider is disabled in Firebase Console. Enable Email/Password and Google under Authentication > Sign-in method.',
        code,
        isProviderError: true,
      };
    }

    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return {
        title: 'Invalid Email or Password',
        message: 'The credentials provided are incorrect. If you do not have an account yet, click "Join Rewards" below to register.',
        code,
      };
    }

    if (code === 'auth/email-already-in-use') {
      return {
        title: 'Email Already Registered',
        message: 'An account with this email address already exists. Please switch to "Sign In".',
        code,
      };
    }

    if (code === 'auth/weak-password') {
      return {
        title: 'Weak Password',
        message: 'Password should be at least 6 characters long.',
        code,
      };
    }

    if (code === 'auth/popup-closed-by-user') {
      return {
        title: 'Sign-In Cancelled',
        message: 'The Google sign-in window was closed before completing authentication.',
        code,
      };
    }

    if (code === 'auth/popup-blocked') {
      return {
        title: 'Popup Blocked',
        message: 'The Google sign-in popup was blocked by your browser. Please allow popups for this site.',
        code,
      };
    }

    return {
      title: 'Authentication Failed',
      message: rawMsg || 'An unexpected authentication error occurred. Please try again.',
      code,
    };
  };

  const copyDomainToClipboard = () => {
    if (!currentDomain) return;
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const createOrSyncUserProfile = async (uid: string, userEmail: string | null, name: string | null) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    let profile: UserProfile;
    if (snap.exists()) {
      const data = snap.data();
      profile = {
        ...(data as UserProfile),
        role: data.role || 'customer',
      };
    } else {
      profile = {
        uid,
        email: userEmail,
        displayName: name || 'Coffee Club Member',
        rewardPoints: 50, // 50 welcome bonus reward points!
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, profile);
    }
    onUserChange(profile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setErrorInfo({
            title: 'Display Name Required',
            message: 'Please enter your name to register for Brewnet Rewards.',
          });
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName });
        await createOrSyncUserProfile(userCred.user.uid, userCred.user.email, displayName);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await createOrSyncUserProfile(userCred.user.uid, userCred.user.email, userCred.user.displayName);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorInfo(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await createOrSyncUserProfile(res.user.uid, res.user.email, res.user.displayName);
      onClose();
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setErrorInfo(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onUserChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-8 text-stone-900 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-stone-900 text-amber-400 font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {currentUser ? 'Brewnet Rewards Account' : isSignUp ? 'Join Brewnet Club' : 'Sign In'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is logged in */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-900 font-bold">Welcome back!</span>
                <span className="text-xs text-amber-800 font-black flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  {currentUser.rewardPoints} Loyalty Points
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-stone-900">
                {currentUser.displayName || 'Coffee Club Member'}
              </h3>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <p className="flex items-center text-amber-900 font-semibold">
                <CheckCircle className="w-4 h-4 mr-1.5 text-amber-700" />
                50 Reward Points = 1 Free Espresso / Pastry
              </p>
              <p>Earn 10 points for every order placed at Brewnet Cafe!</p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-rose-700 font-semibold text-xs border border-stone-200 flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Form for login / register */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorInfo && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-stone-900 space-y-2 text-xs shadow-2xs">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-amber-950">{errorInfo.title}</h4>
                    <p className="text-stone-700 leading-relaxed">{errorInfo.message}</p>
                  </div>
                </div>

                {errorInfo.isDomainError && errorInfo.domainToCopy && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-600">Domain to authorize:</span>
                      <button
                        type="button"
                        onClick={copyDomainToClipboard}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] transition-colors"
                      >
                        <Copy className="w-3 h-3 text-amber-800" />
                        <span>{copied ? 'Copied!' : 'Copy Domain'}</span>
                      </button>
                    </div>
                    <code className="block bg-stone-100 p-1.5 rounded-lg text-stone-800 text-[10px] font-mono break-all font-semibold">
                      {errorInfo.domainToCopy}
                    </code>
                    <p className="text-[10px] text-stone-500 leading-normal">
                      <strong>How to fix:</strong> In Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains, click "Add domain" and paste this value.
                    </p>
                  </div>
                )}

                {errorInfo.isProviderError && (
                  <div className="bg-white/90 p-2 rounded-xl border border-amber-200/80 text-[10px] text-stone-600 mt-2">
                    <strong>How to fix:</strong> Open Firebase Console &gt; Authentication &gt; Sign-in method, then click "Email/Password" or "Google" and enable it.
                  </div>
                )}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Display Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-extrabold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account (+50 Bonus Points)' : 'Sign In'}
            </button>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <span className="relative px-2 bg-white text-stone-400 text-[10px] font-semibold">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-800 hover:underline text-xs font-semibold"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Join Rewards"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
