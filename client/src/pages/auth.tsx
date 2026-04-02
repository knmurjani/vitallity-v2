import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Phone, Shield } from "lucide-react";
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

function VitallityLogo() {
  return (
    <svg viewBox="0 0 44 44" className="w-11 h-11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [authMethod, setAuthMethod] = useState<"main" | "phone" | "email">("main");

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden" data-testid="auth-page">
      {/* Full-bleed hero background */}
      <div className="absolute inset-0">
        <img
          src={heroAuth}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end px-5 pb-8 pt-20">
        {/* Logo area at top */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8 animate-fade-in-up" data-testid="auth-logo">
          <VitallityLogo />
          <h1 className="font-display text-4xl font-bold text-white tracking-tight mt-3">
            Vitallity
          </h1>
          <p className="text-white/70 text-sm mt-2 tracking-wide">Your personal wellness journey</p>
        </div>

        {/* Glass card */}
        <div className="w-full max-w-[420px] glass-card p-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }} data-testid="auth-card">

          {/* Error message */}
          {error && (
            <div className="bg-rose-faded text-rose text-sm px-4 py-3 rounded-[14px] border border-rose/20 mb-4" data-testid="auth-error">
              {error}
            </div>
          )}

          {/* Main auth options */}
          {authMethod === "main" && (
            <div className="space-y-3">
              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-border/50 bg-white text-foreground font-semibold text-sm hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50"
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

              {/* Phone OTP */}
              <button
                type="button"
                onClick={() => { setAuthMethod("phone"); setError(""); }}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-white/20 bg-white/10 text-foreground font-semibold text-sm hover:bg-white/20 transition-all active:scale-[0.98] backdrop-blur-sm"
                data-testid="phone-auth-btn"
                aria-label="Sign in with phone"
              >
                <Phone className="w-4.5 h-4.5" />
                Continue with Phone
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => { setAuthMethod("email"); setError(""); }}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-white/20 bg-white/10 text-foreground font-semibold text-sm hover:bg-white/20 transition-all active:scale-[0.98] backdrop-blur-sm"
                data-testid="email-auth-btn"
                aria-label="Sign in with email"
              >
                <Mail className="w-4.5 h-4.5" />
                Continue with Email
              </button>
            </div>
          )}

          {/* Phone auth */}
          {authMethod === "phone" && (
            <div data-testid="phone-auth-section">
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("main"); setError(""); resetPhoneFlow(); }}
                  className="text-text-mid hover:text-foreground transition-colors"
                  aria-label="Back"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <p className="text-sm font-semibold text-foreground">Sign in with Phone</p>
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm text-foreground font-medium flex-shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className="vitallity-input flex-1"
                      data-testid="phone-input"
                      aria-label="Phone number"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneLoading || !phoneNumber.trim()}
                    className="vitallity-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <p className="text-xs text-text-mid">
                    Code sent to +91{phoneNumber.replace(/^\+91/, "")}
                    <button type="button" onClick={resetPhoneFlow} className="text-primary font-semibold ml-2" aria-label="Change phone number">
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
                        className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        aria-label={`Digit ${i + 1}`}
                        data-testid={`otp-digit-${i}`}
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-xs text-text-mid">
                        Resend in <span className="font-semibold text-foreground">{countdown}s</span>
                      </p>
                    ) : (
                      <button type="button" onClick={handleSendOtp} className="text-xs font-semibold text-primary" aria-label="Resend code">
                        Resend Code
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={phoneLoading || otpDigits.join("").length !== 6}
                    className="vitallity-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* Email auth */}
          {authMethod === "email" && (
            <div data-testid="email-auth-section">
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("main"); setError(""); }}
                  className="text-text-mid hover:text-foreground transition-colors"
                  aria-label="Back"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <p className="text-sm font-semibold text-foreground">Sign in with Email</p>
              </div>

              {/* Toggle */}
              <div className="flex bg-muted/50 rounded-[100px] p-1 mb-5" data-testid="auth-toggle">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-[100px] transition-all ${
                    isLogin ? "bg-primary text-white shadow-sm" : "text-text-mid hover:text-foreground"
                  }`}
                  data-testid="auth-login-tab"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-[100px] transition-all ${
                    !isLogin ? "bg-primary text-white shadow-sm" : "text-text-mid hover:text-foreground"
                  }`}
                  data-testid="auth-signup-tab"
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4" data-testid="auth-form">
                <div>
                  <label className="vitallity-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="vitallity-input pl-11"
                      data-testid="auth-email"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="vitallity-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLogin ? "Enter password" : "Min. 8 characters"}
                      required
                      minLength={isLogin ? 1 : 8}
                      className="vitallity-input pl-11 pr-11"
                      data-testid="auth-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-mid"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="vitallity-btn-primary w-full flex items-center justify-center gap-2 mt-2"
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

        {/* Footer */}
        <p className="text-center text-xs text-white/50 mt-5">
          By continuing, you agree to Vitallity's terms of service.
        </p>
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
