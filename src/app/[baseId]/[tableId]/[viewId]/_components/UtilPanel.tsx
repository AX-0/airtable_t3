"use client";

import { useState, useRef, useEffect } from "react";
import { useClickAway } from "@uidotdev/usehooks";

export function UtilPanel({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    setOpen(false);
  });  


  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((prev) => !prev)}>
        {trigger}
      </button>

      {open && (
        <div
          ref={ref}
          className="absolute z-50 mt-2 w-[500px] rounded-xl border border-gray-200 bg-white shadow-lg p-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
