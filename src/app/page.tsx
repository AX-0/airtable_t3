import Link from "next/link";
import { redirect } from "next/navigation";
import { NotepadText } from "lucide-react";

// import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import HomeNavbar from "./_components/HomeNavbar";
import CreateBaseFallback from "./_components/CreateBaseFallback";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const bases = api.base.getBases();
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <HomeNavbar />
      <main className="min-h-screen bg-[#f9fafb] p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Home</h1>

        {(await bases).length === 0 ? (
          <CreateBaseFallback />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(await bases).map((base) => (
              <div
                key={base.id}
                className="flex justify-between items-center rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 cursor-pointer"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-purple-700 flex items-center justify-center text-white">
                  <NotepadText />
                </div>

                {/* Name */}
                <div className="flex-1 ml-4">
                  <h2 className="text-lg font-semibold text-gray-800">{base.name}</h2>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </HydrateClient>
  );
}


// import Link from "next/link";

// import { LatestPost } from "~/app/_components/post";
// import { auth } from "~/server/auth";
// import { api, HydrateClient } from "~/trpc/server";

// import HomeNavbar from "./_components/HomeNavbar";

// export default async function Home() {
//   const hello = await api.post.hello({ text: "from tRPC" });
//   const session = await auth();

//   if (session?.user) {
//     void api.post.getLatest.prefetch();
//   }

//   return (
    
//     <HydrateClient>
//       <HomeNavbar />

//       <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] text-white">


//         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
//           {/* <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
//             Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
//           </h1>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
//               href="https://create.t3.gg/en/usage/first-steps"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">First Steps →</h3>
//               <div className="text-lg">
//                 Just the basics - Everything you need to know to set up your
//                 database and authentication.
//               </div>
//             </Link>
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
//               href="https://create.t3.gg/en/introduction"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">Documentation →</h3>
//               <div className="text-lg">
//                 Learn more about Create T3 App, the libraries it uses, and how
//                 to deploy it.
//               </div>
//             </Link>
//           </div> */}
//           <div className="flex flex-col items-center gap-2">
//             <p className="text-2xl text-black">
//               {hello ? hello.greeting : "Loading tRPC query..."}
//             </p>

//             <div className="flex flex-col items-center justify-center gap-4">
//               <p className="text-center text-2xl text-black">
//                 {session && <span>Logged in as {session.user?.name}</span>}
//               </p>
//               <Link
//                 href={session ? "/api/auth/signout" : "/api/auth/signin"}
//                 className="rounded-full bg-black/10 px-10 py-3 font-semibold no-underline transition hover:bg-black/20 text-black"
//               >
//                 {session ? "Sign out" : "Sign in"}
//               </Link>
//             </div>
//           </div>

//           {session?.user && <LatestPost />}
//         </div>
//       </main>
//     </HydrateClient>
//   );
// }
