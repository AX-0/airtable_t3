"use client";

import { useState } from "react";

export function GuestNotice() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4 max-w-xl mx-auto mt-6">
      <div className="flex justify-between items-start">
        <div>
          <strong>You&apos;re browsing as a Guest.</strong>
          <p className="text-sm mt-1">
            Guest users can view content but cannot create or modify data. You can still user the filtering/sorting/searching/hide fields features and there are 100k rows of prepopulated data at the &quot;Test&quot; base. Your session is only valid for 30 minutes. To unlock full functionality, please sign in with Google.
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-4 text-yellow-600 hover:text-yellow-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
