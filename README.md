# Airtable Clone (T3 Stack)

A fast, Airtable-inspired spreadsheet web app built with the [T3 Stack](https://create.t3.gg/) (Next.js, tRPC, Prisma, TypeScript), designed for performance, scalability, and smooth UX.
[Live Demo](https://airtable-t3.vercel.app/login)

## Features

* **Google Authentication** – Secure login with Google.
* **Base/Table/View System** – Create and manage bases, tables, views, and columns.
* **Editable Cells** – Inline editing for text and number types with tab navigation.
* **100k+ Row Performance** – Smooth virtualized infinite scroll using **TanStack Virtual** and paginated **tRPC** hooks.
* **Database-Level Filtering & Search** – Fast text and number filters (equals, contains, greater/less than, empty/not empty), search across all cells.
* **Sorting & Visibility** – Sort by column values, toggle visibility per view.
* **Responsive UI** – Built with Tailwind CSS for clean and adaptable interfaces.
* **Deployed** – Live and ready at [airtable-t3.vercel.app](https://airtable-t3.vercel.app/login)

## Tech Stack

* **Frontend**: Next.js, TypeScript, React, Tailwind CSS
* **Backend**: tRPC, Prisma, PostgreSQL
* **Infra**: Vercel (hosting), Google OAuth
* **Others**: TanStack Virtual, Zod, Faker.js
