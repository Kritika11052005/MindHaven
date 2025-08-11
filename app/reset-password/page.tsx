"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Link from "next/link";
import { Lock } from "lucide-react";
import { API_URL } from "../config/constants";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the token from URL parameters
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);
    
    if (!tokenParam) {
      setError("Invalid or missing reset token. Please check your email link.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset token. Please check your email link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      console.log('Making request to reset password...');
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        setError(`Server error: Expected JSON response but got ${contentType}. Check console for details.`);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "An error occurred while resetting your password.");
      }
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Cannot connect to server. Make sure the backend is running on port 3001.");
      } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setError("Server returned invalid response. Check console for details.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show error if no token is present
  if (!token && !loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/30">
        <Container className="flex flex-col items-center justify-center w-full">
          <Card className="w-full md:w-5/12 max-w-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-primary/10 bg-card/90 backdrop-blur-lg mt-20">
            <div className="text-center py-8">
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent mb-4 tracking-tight">
                Invalid Reset Link
              </h1>
              <p className="text-base text-muted-foreground font-medium mb-4">
                This password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/30">
      <Container className="flex flex-col items-center justify-center w-full">
        <Card className="w-full md:w-5/12 max-w-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-primary/10 bg-card/90 backdrop-blur-lg mt-20">
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-1 tracking-tight">
              Reset Password
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              Enter your new password below.
            </p>
          </div>
          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <p className="text-lg text-primary font-semibold mb-2">
                Password reset successful!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-semibold mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-base font-semibold mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-muted-foreground"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-base text-center font-medium">
                    {error}
                  </p>
                </div>
              )}
              <Button
                className="w-full py-2 text-base rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 shadow-md hover:from-primary/80 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
          <div className="my-6 border-t border-primary/10" />
          <p className="text-base text-center text-muted-foreground">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}