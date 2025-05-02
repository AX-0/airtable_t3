import { relations, sql } from "drizzle-orm";
import { pgTable, varchar, uuid, text, integer, pgEnum, index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `airtable_t3_${name}`);

// export const posts = createTable(
//   "post",
//   (d) => ({
//     id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
//     name: d.varchar({ length: 256 }),
//     createdById: d
//       .varchar({ length: 255 })
//       .notNull()
//       .references(() => users.id),
//     createdAt: d
//       .timestamp({ withTimezone: true })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
//   }),
//   (t) => [
//     index("created_by_idx").on(t.createdById),
//     index("name_idx").on(t.name),
//   ],
// );

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const bases = createTable(
  "bases",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    ownerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  // (t) => [
  //   index("owner_idx").on(t.ownerId),
  //   index("name_base").on(t.name),
  // ],
);

export const tables = createTable(
  "tables",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    baseId: d
      .integer()
      .notNull()
      .references(() => bases.id),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("tables_baseid_idx").on(t.baseId),
  ],
);

// export const tables = createTable('tables', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   name: varchar('name', { length: 255 }),
//   baseId: uuid('base_id').references(() => bases.id),
// });

export const columnTypeEnum = pgEnum('ColumnType', ['TEXT', 'NUMBER']);

export const columns = createTable(
  "columns",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull(),
    tableId: d
      .integer()
      .notNull()
      .references(() => tables.id),
    type: columnTypeEnum("ColumnType").notNull().default("TEXT"),
  }),
  (t) => [
    index("columns_tableid_idx").on(t.tableId),
  ],
);

// export const columns = createTable('columns', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   name: varchar('name', { length: 255 }),
//   type: columnTypeEnum('type'),
//   tableId: uuid('table_id').references(() => tables.id),
// });

export const rows = createTable(
  "rows",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull(),
    tableId: d
      .integer()
      .notNull()
      .references(() => tables.id),
    // updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("rows_tableid_id_idx").on(t.tableId, t.id),
    index("rows_tableid_idx").on(t.tableId),
  ],
);

// export const rows = createTable('rows', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   tableId: uuid('table_id').references(() => tables.id),
// });

export const cells = createTable(
  "cells",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    value: text('value').notNull(),
    rowId: d
      .integer()
      .notNull()
      .references(() => rows.id),
    columnId: d
      .integer()
      .notNull()
      .references(() => columns.id),
    // updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("cells_rowid_colid_idx").on(t.rowId, t.columnId),
    index("cells_colid_rowid_idx").on(t.columnId, t.rowId),
  ],
);

// export const cells = createTable('cells', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   rowId: uuid('row_id').references(() => rows.id),
//   columnId: uuid('column_id').references(() => columns.id),
//   value: text('value'),
// });

export const views = createTable(
  "views",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    tableId: d
      .integer()
      .notNull()
      .references(() => tables.id),

    // View configuration:
    filters: d.jsonb().default([]), // [{ columnId, operator, value }]
    sorts: d.jsonb().default([]), // [{ columnId, direction }]
    hiddenColumns: d.jsonb().default([]), // [columnId, columnId, ...]
    searchTerm: d.varchar({ length: 256 }), // optional text search
  }),
  (t) => [
    index("views_tableid_idx").on(t.tableId),
  ],
);