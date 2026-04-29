-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "usageContext" TEXT NOT NULL,
    "scoringWeightEffectiveness" REAL NOT NULL DEFAULT 1,
    "scoringWeightEfficiency" REAL NOT NULL DEFAULT 1,
    "scoringWeightSatisfaction" REAL NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interface" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "prototypeUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interface_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "interfaceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetTimeSec" INTEGER,
    "targetSteps" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "Interface" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "timeSec" INTEGER,
    "stepsCount" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskAttempt_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAttempt_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "interfaceId" INTEGER NOT NULL,
    "dimension" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weight" REAL NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "Interface" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "interfaceId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "valueNumber" REAL,
    "valueText" TEXT,
    "valueBoolean" BOOLEAN,
    "valueLikert" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Answer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "Interface" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Result" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "recommendedInterfaceId" INTEGER,
    "effectivenessScore" REAL NOT NULL,
    "efficiencyScore" REAL NOT NULL,
    "satisfactionScore" REAL NOT NULL,
    "overallScore" REAL NOT NULL,
    "conclusions" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Result_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Result_recommendedInterfaceId_fkey" FOREIGN KEY ("recommendedInterfaceId") REFERENCES "Interface" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterfaceSelection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "interfaceId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterfaceSelection_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InterfaceSelection_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InterfaceSelection_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "Interface" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resultId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserStory_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualUserStory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "interfaceId" INTEGER,
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
    CONSTRAINT "ManualUserStory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluationEvaluator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "assignedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationEvaluator_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationEvaluator_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationEvaluator_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluationSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "EvaluationSession_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationSession_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationId" INTEGER,
    "actorId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "data" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Interface_evaluationId_order_key" ON "Interface"("evaluationId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Task_interfaceId_order_key" ON "Task"("interfaceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAttempt_evaluationId_taskId_evaluatorId_key" ON "TaskAttempt"("evaluationId", "taskId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_interfaceId_order_key" ON "Question"("interfaceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_evaluationId_questionId_evaluatorId_key" ON "Answer"("evaluationId", "questionId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_evaluationId_key" ON "Result"("evaluationId");

-- CreateIndex
CREATE INDEX "InterfaceSelection_evaluationId_idx" ON "InterfaceSelection"("evaluationId");

-- CreateIndex
CREATE INDEX "InterfaceSelection_interfaceId_idx" ON "InterfaceSelection"("interfaceId");

-- CreateIndex
CREATE INDEX "InterfaceSelection_evaluatorId_idx" ON "InterfaceSelection"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "InterfaceSelection_evaluationId_evaluatorId_key" ON "InterfaceSelection"("evaluationId", "evaluatorId");

-- CreateIndex
CREATE INDEX "ManualUserStory_evaluationId_idx" ON "ManualUserStory"("evaluationId");

-- CreateIndex
CREATE INDEX "ManualUserStory_interfaceId_idx" ON "ManualUserStory"("interfaceId");

-- CreateIndex
CREATE INDEX "ManualUserStory_createdById_idx" ON "ManualUserStory"("createdById");

-- CreateIndex
CREATE INDEX "EvaluationEvaluator_evaluationId_idx" ON "EvaluationEvaluator"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationEvaluator_evaluationId_evaluatorId_key" ON "EvaluationEvaluator"("evaluationId", "evaluatorId");

-- CreateIndex
CREATE INDEX "EvaluationSession_evaluationId_idx" ON "EvaluationSession"("evaluationId");

-- CreateIndex
CREATE INDEX "EvaluationSession_evaluatorId_idx" ON "EvaluationSession"("evaluatorId");

-- CreateIndex
CREATE INDEX "AuditLog_evaluationId_idx" ON "AuditLog"("evaluationId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
