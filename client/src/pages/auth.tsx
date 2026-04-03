import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Phone, Shield, ChevronRight } from "lucide-react";
import heroAuth from "@assets/hero-auth.jpg";

declare const google: any;

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function VitallityLogo({ size = "normal" }: { size?: "normal" | "small" }) {
  const cls = size === "small" ? "w-7 h-7" : "w-11 h-11";
  return (
    <svg viewBox="0 0 44 44" className={cls} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 38V20" />
      <path d="M22 20C22 20 14 14 14 8C14 5 16 4 18 4C20 4 22 7 22 10" />
      <path d="M22 20C22 20 30 14 30 8C30 5 28 4 26 4C24 4 22 7 22 10" />
      <path d="M22 28C19 28 13 26 10 22" />
      <path d="M22 32C25 32 31 30 34 26" />
    </svg>
  );
}

export default function AuthPage() {
  const { login, signup, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [stage, setStage] = useState<"hero" | "options" | "phone" | "email">("hero");

  // Email auth state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Google auth state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");

  useEffect(() => {
    const initGoogle = () => {
      if (typeof google !== "undefined" && google.accounts) {
        const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
        if (clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
          });
        }
      }
    };
    initGoogle();
    const timer = setTimeout(initGoogle, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleGoogleCallback = async (response: any) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle(response.credential);
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError("");
    if (typeof google !== "undefined" && google.accounts) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError("Google Sign-In unavailable. Please try another method.");
        }
      });
    } else {
      setError("Google Sign-In not loaded. Please try another method.");
    }
  };

  const handleSendOtp = async () => {
    const phone = phoneNumber.trim();
    if (phone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setPhoneLoading(true);
    setError("");
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      await sendPhoneOtp(fullPhone);
      setOtpSent(true);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setPhoneLoading(true);
    setError("");
    try {
      const fullPhone = phoneNumber.trim().startsWith("+") ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;
      await verifyPhoneOtp(fullPhone, otp);
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setEmailLoading(false);
          return;
        }
        await signup(email, password);
      }
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const resetPhoneFlow = () => {
    setOtpSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setCountdown(0);
  };

  const goBack = () => {
    setError("");
    if (stage === "options") setStage("hero");
    else if (stage === "phone" || stage === "email") setStage("options");
  };

  // Is any panel open (not the hero)?
  const panelOpen = stage !== "hero";

  return (
    <div className="relative min-h-screen w-full overflow-hidden" data-testid="auth-page">
      {/* Full-bleed hero background */}
      <div className="absolute inset-0">
        <img
          src={heroAuth}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: panelOpen ? "scale(1.03)" : "scale(1)" }}
          aria-hidden="true"
        />
        {/* Subtle vignette overlay -- stronger when panel is open */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: panelOpen
              ? "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 100%)"
              : "linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.05) 100%)",
          }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── HERO STATE: branding + Continue button ── */}
        {stage === "hero" && (
          <>
            {/* Top-left branding */}
            <div className="flex items-center gap-2.5 px-5 pt-6 animate-fade-in-up" data-testid="auth-logo">
              <VitallityLogo size="small" />
              <span className="font-display text-xl font-bold text-white tracking-tight">Vitallity</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom area: tagline + Continue */}
            <div className="px-5 pb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-white/90 text-lg font-display font-semibold leading-snug mb-1">
                Your personal
              </p>
              <p className="text-white text-3xl font-display font-bold leading-tight mb-6 tracking-tight">
                wellness journey
              </p>

              <button
                type="button"
                onClick={() => setStage("options")}
                className="group flex items-center gap-3 py-3.5 px-7 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-semibold text-sm tracking-wide hover:bg-white/25 transition-all active:scale-[0.97]"
                data-testid="continue-btn"
                aria-label="Continue to sign in"
              >
                Continue
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-white/40 text-xs mt-4">
                By continuing, you agree to Vitallity's terms of service.
              </p>
            </div>
          </>
        )}

        {/* ── AUTH PANEL: slides in from left ── */}
        {panelOpen && (
          <div className="flex-1 flex flex-col px-5 pt-6 pb-8 animate-fade-in-up">
            {/* Back button */}
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-6 w-fit transition-colors"
              data-testid="auth-back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Panel content */}
            <div className="flex-1 flex flex-col justify-end max-w-[420px] w-full">

              {/* ── OPTIONS: Google / Phone / Email ── */}
              {stage === "options" && (
                <div className="animate-fade-in-up">
                  <h2 className="font-display text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome</h2>
                  <p className="text-white/60 text-sm mb-6">Sign in or create an account to continue</p>

                  {error && (
                    <div className="bg-rose-500/15 text-rose-200 text-sm px-4 py-3 rounded-2xl border border-rose-400/20 mb-4" data-testid="auth-error">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={handleGoogleClick}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-gray-800 font-semibold text-sm hover:bg-white/95 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-black/10"
                      data-testid="google-signin-btn"
                      aria-label="Continue with Google"
                    >
                      {googleLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <GoogleIcon />
                          Continue with Google
                        </>
                      )}
                    </button>

                    {/* Phone */}
                    <button
                      type="button"
                      onClick={() => { setStage("phone"); setError(""); }}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all active:scale-[0.98]"
                      data-testid="phone-auth-btn"
                      aria-label="Continue with Phone"
                    >
                      <Phone className="w-4.5 h-4.5" />
                      Continue with Phone
                    </button>

                    {/* Email */}
                    <button
                      type="button"
                      onClick={() => { setStage("email"); setError(""); }}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all active:scale-[0.98]"
                      data-testid="email-auth-btn"
                      aria-label="Continue with Email"
                    >
                      <Mail className="w-4.5 h-4.5" />
                      Continue with Email
                    </button>
                  </div>

                  <p className="text-white/35 text-xs mt-5">
                    By continuing, you agree to Vitallity's terms of service.
                  </p>
                </div>
              )}

              {/* ── PHONE AUTH ── */}
              {stage === "phone" && (
                <div className="animate-fade-in-up" data-testid="phone-auth-section">
                  <h2 className="font-display text-2xl font-bold text-white mb-1.5 tracking-tight">Phone Sign In</h2>
                  <p className="text-white/60 text-sm mb-6">We'll send you a verification code</p>

                  {error && (
                    <div className="bg-rose-500/15 text-rose-200 text-sm px-4 py-3 rounded-2xl border border-rose-400/20 mb-4" data-testid="auth-error">
                      {error}
                    </div>
                  )}

                  {!otpSent ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3.5 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-sm text-white font-medium flex-shrink-0">
                          +91
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Phone number"
                          className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/40 transition-colors"
                          data-testid="phone-input"
                          aria-label="Phone number"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={phoneLoading || !phoneNumber.trim()}
                        className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-semibold text-sm hover:bg-white/95 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        data-testid="send-otp-btn"
                        aria-label="Send verification code"
                      >
                        {phoneLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Send Code
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/60">
                        Code sent to +91{phoneNumber.replace(/^\+91/, "")}
                        <button type="button" onClick={resetPhoneFlow} className="text-white font-semibold ml-2" aria-label="Change phone number">
                          Change
                        </button>
                      </p>
                      <div className="flex justify-center gap-2.5" data-testid="otp-input-group">
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className="w-12 h-12 text-center text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white focus:border-white/50 focus:ring-1 focus:ring-white/30 outline-none transition-colors"
                            aria-label={`Digit ${i + 1}`}
                            data-testid={`otp-digit-${i}`}
                          />
                        ))}
                      </div>
                      <div className="text-center">
                        {countdown > 0 ? (
                          <p className="text-xs text-white/50">
                            Resend in <span className="font-semibold text-white/80">{countdown}s</span>
                          </p>
                        ) : (
                          <button type="button" onClick={handleSendOtp} className="text-xs font-semibold text-white/80 hover:text-white" aria-label="Resend code">
                            Resend Code
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={phoneLoading || otpDigits.join("").length !== 6}
                        className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-semibold text-sm hover:bg-white/95 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        data-testid="verify-otp-btn"
                        aria-label="Verify code"
                      >
                        {phoneLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Verify
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── EMAIL AUTH ── */}
              {stage === "email" && (
                <div className="animate-fade-in-up" data-testid="email-auth-section">
                  <h2 className="font-display text-2xl font-bold text-white mb-1.5 tracking-tight">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-white/60 text-sm mb-5">
                    {isLogin ? "Sign in to continue your journey" : "Start your wellness journey today"}
                  </p>

                  {error && (
                    <div className="bg-rose-500/15 text-rose-200 text-sm px-4 py-3 rounded-2xl border border-rose-400/20 mb-4" data-testid="auth-error">
                      {error}
                    </div>
                  )}

                  {/* Toggle */}
                  <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 mb-5 border border-white/10" data-testid="auth-toggle">
                    <button
                      type="button"
                      onClick={() => { setIsLogin(true); setError(""); }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                        isLogin ? "bg-white text-gray-800 shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                      data-testid="auth-login-tab"
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsLogin(false); setError(""); }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                        !isLogin ? "bg-white text-gray-800 shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                      data-testid="auth-signup-tab"
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4" data-testid="auth-form">
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white placeholder:text-white/35 text-sm outline-none focus:border-white/40 transition-colors"
                          data-testid="auth-email"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isLogin ? "Enter password" : "Min. 8 characters"}
                          required
                          minLength={isLogin ? 1 : 8}
                          className="w-full pl-11 pr-11 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white placeholder:text-white/35 text-sm outline-none focus:border-white/40 transition-colors"
                          data-testid="auth-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-semibold text-sm hover:bg-white/95 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                      data-testid="auth-submit"
                    >
                      {emailLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {isLogin ? "Log In" : "Create Account"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseError(err: any): string {
  const msg = err.message || "Something went wrong";
  try {
    const parsed = JSON.parse(msg.replace(/^\d+:\s*/, ""));
    return parsed.message || msg;
  } catch {
    return msg.replace(/^\d+:\s*/, "");
  }
}
