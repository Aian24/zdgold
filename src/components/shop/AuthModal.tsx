'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    loginWithSocial,
    loginWithCredentials,
    registerUser,
    loginAdmin,
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

  useEffect(() => {
    if (authModalTab) {
      setActiveTab(authModalTab === 'register' ? 'register' : 'signin');
    }
  }, [authModalTab]);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [activeTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Real OAuth Login Handlers
  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    const callback = typeof window !== 'undefined' ? window.location.pathname : '/account';
    window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(callback)}`;
  };

  const handleFacebookSignIn = () => {
    setIsSubmitting(true);
    const callback = typeof window !== 'undefined' ? window.location.pathname : '/account';
    window.location.href = `/api/auth/facebook?callbackUrl=${encodeURIComponent(callback)}`;
  };

  // 1. Social Login Handlers (Modal Fallback)
  const handleQuickSocial = async (provider: 'google' | 'facebook', profile?: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await loginWithSocial(provider, profile);
      if (res?.success) {
        setSuccessMessage(`Welcome, ${res.user.name.split(' ')[0]}! Signed in via ${provider.toUpperCase()}.`);
        setTimeout(() => {
          setSocialProviderModal(null);
          closeAuthModal();
        }, 1000);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Social connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Email Sign In Handler (Handles both Customers & Administrators)
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
      if (res.user.role === 'ADMIN') {
        setSuccessMessage(`Welcome Administrator, ${res.user.name.split(' ')[0]}! Redirecting...`);
        setTimeout(() => {
          closeAuthModal();
          router.push('/admin/orders');
        }, 700);
      } else {
        setSuccessMessage(`Welcome back, ${res.user.name.split(' ')[0]}! Signed in successfully.`);
        setTimeout(() => {
          closeAuthModal();
          router.refresh();
        }, 700);
      }
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
    setIsSubmitting(false);
  };

  // 3. Register Handler
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
      setSuccessMessage('Account created successfully.');
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 800);
    } else {
      setErrorMessage(res.error || 'Failed to create account.');
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
        {/* Background Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={closeAuthModal}
          aria-hidden="true"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative w-full max-w-md rounded-2xl border border-gold-500/30 bg-white p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-neutral-900"
        >
          {/* Close Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Brand Header */}
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-xl font-bold font-serif text-neutral-900">
              {settings.companyName}
            </h2>
            <p className="text-xs text-neutral-500">
              {activeTab === 'signin' && 'Sign in to access price-locked layaways, receipts, and orders.'}
              {activeTab === 'register' && 'Create your customer account to lock gold rates at 0% interest.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </motion.div>
          )}

          {/* Tab Navigation with Animated Layout Pill */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 border border-neutral-200 mb-4">
            {(['signin', 'register'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <motion.button
                  key={tab}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer capitalize ${
                    isSelected
                      ? 'text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="auth-tab-active-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs -z-0"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tab === 'signin' ? 'Sign In' : 'Register'}</span>
                </motion.button>
              );
            })}
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              {/* Quick Social Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs hover:border-gold-500 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  <span>Google</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFacebookSignIn}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#1877F2]/30 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </motion.button>
              </div>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-wider whitespace-nowrap">
                  Or with email
                </span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600">
                    <input type="checkbox" defaultChecked className="rounded text-gold-500 focus:ring-gold-400" />
                    <span>Remember me</span>
                  </label>
                </div>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    className="w-full text-xs font-bold uppercase tracking-wider mt-1"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Sign In
                  </Button>
                </motion.div>
              </form>

              <p className="text-center text-xs text-neutral-500 pt-1">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-gold-700 font-bold hover:underline"
                >
                  Register
                </button>
              </p>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                label="Full Legal Name *"
                placeholder="e.g. Juan dela Cruz"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. client@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Mobile (+63)"
                  placeholder="+63 917 123 4567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
                <Input
                  label="Location"
                  placeholder="Metro Manila"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Password *"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
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
                  label="Confirm *"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-type"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
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

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="w-full text-xs font-bold uppercase tracking-wider mt-1"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Create Account
                </Button>
              </motion.div>

              <p className="text-center text-xs text-neutral-500 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-gold-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </motion.div>

        {/* Social Provider Modal */}
        <AnimatePresence>
          {socialProviderModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="relative w-full max-w-sm rounded-2xl bg-white border border-neutral-200 p-5 shadow-2xl space-y-4 text-neutral-900"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900">
                    {socialProviderModal === 'google' ? 'Sign in with Google' : 'Log in with Facebook'}
                  </h3>
                  <button
                    onClick={() => setSocialProviderModal(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-neutral-500">
                  Select an account to continue to <b>{settings.companyName}</b>:
                </p>

                <div className="space-y-2">
                  {socialProviderModal === 'google' ? (
                    <>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          handleQuickSocial('google', {
                            name: 'Maria Santos',
                            email: 'maria.santos@gmail.com',
                            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                          })
                        }
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 hover:border-gold-500 hover:bg-gold-50/40 text-left transition-all group cursor-pointer"
                      >
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                          alt="Maria Santos"
                          className="w-8 h-8 rounded-full object-cover border border-gold-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 group-hover:text-gold-800">Maria Santos</p>
                          <p className="text-[10px] text-neutral-500 truncate">maria.santos@gmail.com</p>
                        </div>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          handleQuickSocial('google', {
                            name: 'Juan dela Cruz',
                            email: 'juan.delacruz@gmail.com',
                            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                          })
                        }
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 hover:border-gold-500 hover:bg-gold-50/40 text-left transition-all group cursor-pointer"
                      >
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                          alt="Juan dela Cruz"
                          className="w-8 h-8 rounded-full object-cover border border-gold-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 group-hover:text-gold-800">Juan dela Cruz</p>
                          <p className="text-[10px] text-neutral-500 truncate">juan.delacruz@gmail.com</p>
                        </div>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        handleQuickSocial('facebook', {
                          name: 'Juan dela Cruz',
                          email: 'juan.delacruz@facebook.com',
                          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                        })
                      }
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 hover:border-[#1877F2] hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                        alt="Juan dela Cruz"
                        className="w-8 h-8 rounded-full object-cover border border-blue-500/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 group-hover:text-[#1877F2]">Juan dela Cruz</p>
                        <p className="text-[10px] text-neutral-500 truncate">Continue as Juan</p>
                      </div>
                    </motion.button>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-600 block">Or use another email:</span>
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
                    Sign In
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
