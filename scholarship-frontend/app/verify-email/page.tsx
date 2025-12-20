"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/src/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing verification token");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.get(`/auth/verify-email`, {
          params: { token },
        });

        setSuccess(true);

        // Redirect to login after 2s
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Email verification failed"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 border rounded-lg text-center">
        {loading && <p>Verifying your email…</p>}

        {!loading && success && (
          <>
            <h2 className="text-green-600 text-xl font-semibold">
              Email verified successfully 🎉
            </h2>
            <p className="mt-2 text-gray-600">
              Redirecting to login…
            </p>
          </>
        )}

        {!loading && error && (
          <>
            <h2 className="text-red-600 text-xl font-semibold">
              Verification failed
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
