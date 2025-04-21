// import Link from "next/link";
import { redirect } from "next/navigation";

import { appRouter } from "~/server/api/root";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { db } from "~/server/db";
import SuperJSON from "superjson";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";


// import CreateBaseFallback from "./_components/CreateBaseFallback";
// import CreateBaseTrigger from "./_components/CreateBaseTrigger";
import BaseCard from "./_components/BaseCard";
import { CreateBase } from "./_components/CreateBase";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      session,
      db,
      headers: new Headers(),
    },
    transformer: SuperJSON,
  });
  
  const bases = await helpers.base.getBases.fetch();

  // if (session?.user) {
  //   void api.post.getLatest.prefetch();
  // }

  return (
    <HydrateClient>
      <main className="min-h-screen bg-[#f9fafb] p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Home</h1>

        {/* {bases.length === 0 ? (
          <CreateBaseFallback />
        ) : ( */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {bases.map((base) => (
              <BaseCard key={base.id} base={base} />
            ))}


            {/* <div className="flex justify-between items-center rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 cursor-pointer"> */}
            {/* <CreateBaseTrigger /> */}
            {/* </div> */}
            <CreateBase />

          </div>
        {/* )} */}
      </main>
    </HydrateClient>
  );
}