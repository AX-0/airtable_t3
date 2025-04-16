"use client";

import { CreateBase } from "./CreateBase";

export default function CreateBaseTrigger() {
  return (
    <CreateBase
      triggerButton={(open) => (
        <button
          onClick={open}
          className="flex justify-center items-center rounded-xl bg-blue-500 text-white text-lg font-semibold shadow-sm hover:shadow-md transition p-4 cursor-pointer"
        >
          Create New Base
        </button>
      )}
    />
  );
}
