"use client";

import Link from "next/link";
import { useAppSelector } from "@/src/store/hooks";

export default function HomePage() {
  const { isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* NAVBAR */}
      <header className="flex justify-between items-center px-10 py-6">
        <h1 className="text-2xl font-bold text-indigo-600">
          🎓 Scholarship Platform
        </h1>

        <nav className="space-x-4">
          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </>
          )}

          {isAuthenticated && (
            <Link
              href={
                user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                  ? "/admin"
                  : "/dashboard"
              }
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Dashboard
            </Link>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h2 className="text-5xl font-extrabold text-gray-900 max-w-4xl">
          Apply for Scholarships. <br />
          <span className="text-indigo-600">
            Manage Applications Seamlessly.
          </span>
        </h2>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
          A centralized platform for students to apply for scholarships
          and for administrators to manage applications efficiently.
        </p>

        <div className="mt-10 flex gap-4">
          {!isAuthenticated ? (
            <>
              <Link
                href="/signup"
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white text-lg hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-lg border border-gray-300 text-lg hover:bg-gray-100"
              >
                Login
              </Link>
            </>
          ) : (
            <Link
              href={
                user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                  ? "/admin"
                  : "/dashboard"
              }
              className="px-8 py-3 rounded-lg bg-indigo-600 text-white text-lg hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-10 py-20 bg-white">
        <h3 className="text-3xl font-bold text-center mb-12">
          Why Use This Platform?
        </h3>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Feature
            title="Easy Applications"
            desc="Apply to multiple scholarships with a simple and intuitive process."
          />
          <Feature
            title="Document Uploads"
            desc="Securely upload and manage all required documents."
          />
          <Feature
            title="Admin Control"
            desc="Admins can review, approve, and manage applications efficiently."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-gray-500">
        © {new Date().getFullYear()} Scholarship Platform. All rights reserved.
      </footer>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border hover:shadow-md transition">
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}
