-- CreateTable
CREATE TABLE "ProfileAssessment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "answersJson" TEXT NOT NULL,
    "scoreAvg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileAssessment_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileAssessment_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfileAssessment_evaluationId_idx" ON "ProfileAssessment"("evaluationId");

-- CreateIndex
CREATE INDEX "ProfileAssessment_evaluatorId_idx" ON "ProfileAssessment"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAssessment_evaluationId_evaluatorId_key" ON "ProfileAssessment"("evaluationId", "evaluatorId");
