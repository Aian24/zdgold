'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  LogIn,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const {
    user,
    loginWithSocial,
    loginWithCredentials,
    registerUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Interactive Social OAuth Dialog state
  const [socialProviderModal, setSocialProviderModal] = useState<'google' | 'facebook' | null>(null);
  const [customSocialName, setCustomSocialName] = useState('');
  const [customSocialEmail, setCustomSocialEmail] = useState('');

  // Sign In form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+63 ');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const isRemembered = localStorage.getItem('zd_remember_me');
      const savedEmail = localStorage.getItem('zd_remembered_email');
      if (isRemembered === 'false') {
        setRememberMe(false);
      } else if (savedEmail) {
        setLoginEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {}
  }, []);

  // Real OAuth Login Handlers
  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    window.location.href = '/api/auth/google?callbackUrl=/account';
  };

  const handleFacebookSignIn = () => {
    setIsSubmitting(true);
    window.location.href = '/api/auth/facebook?callbackUrl=/account';
  };

  // Social Login fallback / modal picker
  const handleQuickSocial = async (provider: 'google' | 'facebook', profile?: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await loginWithSocial(provider, profile);
      if (res?.success) {
        setSuccessMessage(`Welcome, ${res.user.name.split(' ')[0]}! Signed in via ${provider.toUpperCase()}.`);
        setTimeout(() => {
          setSocialProviderModal(null);
          router.push('/account');
        }, 1000);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Social login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await loginWithCredentials(loginEmail, loginPassword);
    if (res.success && res.user) {
      try {
        if (rememberMe) {
          localStorage.setItem('zd_remember_me', 'true');
          localStorage.setItem('zd_remembered_email', loginEmail.trim());
        } else {
          localStorage.setItem('zd_remember_me', 'false');
          localStorage.removeItem('zd_remembered_email');
        }
      } catch (e) {}

      if (res.user.role === 'ADMIN') {
        setSuccessMessage('Admin credentials verified. Redirecting to Executive Portal...');
        setTimeout(() => {
          router.push('/admin/orders');
        }, 700);
      } else {
        setSuccessMessage(`Welcome, ${res.user.name?.split(' ')[0] || 'Client'}! Signed in successfully.`);
        setTimeout(() => {
          router.push('/account');
        }, 700);
      }
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
    setIsSubmitting(false);
  };

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      address: regAddress,
    });

    if (res.success) {
      setSuccessMessage(`Account registered successfully! Welcome to ${settings.companyName || 'your account'}.`);
      setTimeout(() => {
        router.push('/account');
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-16 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center p-0.5 mx-auto shadow-md">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <span className="font-serif font-black text-gold-600 text-base">
              {settings.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
          {settings.companyName} Portal
        </h1>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Access your price-locked layaway contracts, order history, or management dashboard.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('signin');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'signin'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'register'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Create Account
        </button>
      </div>

      {/* Status Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SIGN IN */}
      {/* ========================================================================= */}
      {activeTab === 'signin' && (
        <div className="rounded-3xl bg-white border border-gold-500/30 p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          {/* Social Quick Connect */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block text-center">
              Quick Connect with Social Account:
            </span>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-xs hover:border-gold-500 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-[#1877F2]/30 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-wider whitespace-nowrap">
              Or sign in with email
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. client@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4 text-neutral-400" />}
              required
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-gold-700 cursor-pointer p-1 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none hover:text-neutral-900 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 border-neutral-300 cursor-pointer accent-amber-600"
                />
                <span className="font-medium">Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full text-xs font-bold uppercase tracking-wider mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Account
            </Button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister} className="rounded-3xl bg-white border border-gold-500/30 p-6 sm:p-8 space-y-4 shadow-sm animate-in fade-in">
          <Input
            label="Full Legal Name *"
            placeholder="e.g. Juan dela Cruz"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-neutral-400" />}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. client@example.com"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mobile Number (+63)"
              placeholder="+63 917 123 4567"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-neutral-400" />}
            />
            <Input
              label="Delivery Location"
              placeholder="e.g. Metro Manila"
              value={regAddress}
              onChange={(e) => setRegAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-neutral-400" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Create Password *"
              type={showRegPassword ? 'text' : 'password'}
              placeholder="Min 6 characters"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4 text-neutral-400" />}
              required
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-neutral-400 hover:text-gold-700 cursor-pointer p-1 transition-colors"
                  title={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Input
              label="Confirm Password *"
              type={showRegConfirmPassword ? 'text' : 'password'}
              placeholder="Re-type password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4 text-neutral-400" />}
              required
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="text-neutral-400 hover:text-gold-700 cursor-pointer p-1 transition-colors"
                  title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <div className="p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/25 text-xs text-neutral-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-600 flex-shrink-0" />
            <span>0% interest layaways, authentic gold guarantees, and instant price locks.</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full text-xs font-bold uppercase tracking-wider mt-2"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Permanent Account
          </Button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* REALISTIC SOCIAL OAUTH PICKER MODAL (Google & Facebook) */}
      {/* ========================================================================= */}
      {socialProviderModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 shadow-2xl space-y-5 text-neutral-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                {socialProviderModal === 'google' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <h3 className="text-sm font-bold text-neutral-900">
                  {socialProviderModal === 'google' ? 'Sign in with Google' : 'Log in with Facebook'}
                </h3>
              </div>
              <button
                onClick={() => setSocialProviderModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Choose an account to continue to <b>{settings.companyName}</b>:
            </p>

            <div className="space-y-2">
              {socialProviderModal === 'google' ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSocial('google', {
                        name: 'Maria Santos',
                        email: 'maria.santos@gmail.com',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-gold-500 hover:bg-gold-50/40 text-left transition-all group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                      alt="Maria Santos"
                      className="w-9 h-9 rounded-full object-cover border border-gold-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-gold-800">Maria Santos</p>
                      <p className="text-[11px] text-neutral-500 truncate">maria.santos@gmail.com</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSocial('google', {
                        name: 'Juan dela Cruz',
                        email: 'juan.delacruz@gmail.com',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-gold-500 hover:bg-gold-50/40 text-left transition-all group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                      alt="Juan dela Cruz"
                      className="w-9 h-9 rounded-full object-cover border border-gold-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-gold-800">Juan dela Cruz</p>
                      <p className="text-[11px] text-neutral-500 truncate">juan.delacruz@gmail.com</p>
                    </div>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleQuickSocial('facebook', {
                      name: 'Juan dela Cruz',
                      email: 'juan.delacruz@facebook.com',
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                    })
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-[#1877F2] hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                    alt="Juan dela Cruz"
                    className="w-9 h-9 rounded-full object-cover border border-blue-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 group-hover:text-[#1877F2]">Juan dela Cruz</p>
                    <p className="text-[11px] text-neutral-500 truncate">Continue as Juan</p>
                  </div>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-100 space-y-3">
              <span className="text-[11px] font-bold text-neutral-600 block">Or use another account:</span>
              <Input
                placeholder="Full Name"
                value={customSocialName}
                onChange={(e) => setCustomSocialName(e.target.value)}
              />
              <Input
                type="email"
                placeholder={socialProviderModal === 'google' ? 'your.name@gmail.com' : 'your.name@facebook.com'}
                value={customSocialEmail}
                onChange={(e) => setCustomSocialEmail(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!customSocialEmail) {
                    alert('Please enter an email.');
                    return;
                  }
                  handleQuickSocial(socialProviderModal, {
                    name: customSocialName || customSocialEmail.split('@')[0],
                    email: customSocialEmail,
                  });
                }}
                className="w-full text-xs font-bold"
              >
                Sign In with this {socialProviderModal === 'google' ? 'Google' : 'Facebook'} Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
