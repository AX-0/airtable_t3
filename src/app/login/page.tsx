"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/"); // If already logged in, go home
        }
    }, [status, router]);

    if (status === "loading") {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb]">
            <div className="flex flex-col items-center gap-8 p-8 rounded-lg bg-white shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">Welcome to Airtable T3</h1>
                <p className="text-gray-600">Please sign in to continue</p>

                <button
                    onClick={() => signIn("google")}
                    className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                    Sign in with Google
                </button>
            </div>
        </main>
    );
}
