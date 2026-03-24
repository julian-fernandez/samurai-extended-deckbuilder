import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const fn = tab === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSubmitting(false);
    } else if (tab === "signup") {
      setMessage({
        type: "success",
        text: "Check your email to confirm your account, then sign in.",
      });
      setSubmitting(false);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {["signin", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMessage(null); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === t
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <p className={`text-sm rounded-lg px-3 py-2 ${
                message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60"
            >
              {submitting
                ? "Please wait…"
                : tab === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {tab === "signup" && (
            <p className="text-xs text-center text-gray-400">
              You'll receive a confirmation email before you can sign in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
