import { redirect } from "next/navigation";

import { appRouter } from "~/server/api/root";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { db } from "~/server/db";
import SuperJSON from "superjson";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import HomePage from "./HomePage";

export default async function Home() {
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

    return (
        <HydrateClient>
            <main>
                <HomePage bases={bases}/>
            </main>
        </HydrateClient>
    );
}