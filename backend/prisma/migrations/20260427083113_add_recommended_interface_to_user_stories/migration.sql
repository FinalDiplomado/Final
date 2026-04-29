-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ManualUserStory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "interfaceId" INTEGER,
    "recommendedInterfaceId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "mosCow" TEXT NOT NULL DEFAULT 'SHOULD',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "riceReach" REAL,
    "riceImpact" REAL,
    "riceConfidence" REAL,
    "riceEffort" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualUserStory_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualUserStory_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "Interface" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualUserStory_recommendedInterfaceId_fkey" FOREIGN KEY ("recommendedInterfaceId") REFERENCES "Interface" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualUserStory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ManualUserStory" ("acceptanceCriteria", "createdAt", "createdById", "evaluationId", "id", "interfaceId", "mosCow", "narrative", "priority", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "status", "title", "updatedAt") SELECT "acceptanceCriteria", "createdAt", "createdById", "evaluationId", "id", "interfaceId", "mosCow", "narrative", "priority", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "status", "title", "updatedAt" FROM "ManualUserStory";
DROP TABLE "ManualUserStory";
ALTER TABLE "new_ManualUserStory" RENAME TO "ManualUserStory";
CREATE INDEX "ManualUserStory_evaluationId_idx" ON "ManualUserStory"("evaluationId");
CREATE INDEX "ManualUserStory_interfaceId_idx" ON "ManualUserStory"("interfaceId");
CREATE INDEX "ManualUserStory_recommendedInterfaceId_idx" ON "ManualUserStory"("recommendedInterfaceId");
CREATE INDEX "ManualUserStory_createdById_idx" ON "ManualUserStory"("createdById");
CREATE TABLE "new_UserStory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resultId" INTEGER NOT NULL,
    "recommendedInterfaceId" INTEGER,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserStory_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserStory_recommendedInterfaceId_fkey" FOREIGN KEY ("recommendedInterfaceId") REFERENCES "Interface" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserStory" ("acceptanceCriteria", "createdAt", "id", "narrative", "priority", "resultId", "title") SELECT "acceptanceCriteria", "createdAt", "id", "narrative", "priority", "resultId", "title" FROM "UserStory";
DROP TABLE "UserStory";
ALTER TABLE "new_UserStory" RENAME TO "UserStory";
CREATE INDEX "UserStory_recommendedInterfaceId_idx" ON "UserStory"("recommendedInterfaceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
