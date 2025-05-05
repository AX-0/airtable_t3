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
import Sidebar from "./_components/HomeSideBar";
import HomePage from "./HomePage";

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
      <main>
        <HomePage bases={bases}/>
      </main>
    </HydrateClient>
  );
}