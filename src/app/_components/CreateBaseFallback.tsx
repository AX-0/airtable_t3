"use client";

import { useRouter } from "next/navigation";

export default function CreateBaseFallback() {
  const router = useRouter();

  return (
    <div className="text-center">
      <p className="mb-4 text-gray-800">You don&apos;t have any bases yet.</p>
      <button
        onClick={() => router.push("/create-base")}
        className="px-6 py-3 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 cursor-pointer transition"
      >
        Create Base
      </button>
    </div>
  );
}
