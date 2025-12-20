"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/auth.slice";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-bold text-lg">
        🎓 Scholarship Platform
      </Link>

      <div className="flex gap-4">
        {!isAuthenticated && (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </>
        )}

        {isAuthenticated && (
          <>
            {user?.role === "APPLICANT" && (
              <Link href="/dashboard">Dashboard</Link>
            )}
            {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Link href="/admin">Admin</Link>
            )}
            <button onClick={handleLogout} className="text-red-500">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
