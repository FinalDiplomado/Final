import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env"), override: true });

const databaseUrl = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
