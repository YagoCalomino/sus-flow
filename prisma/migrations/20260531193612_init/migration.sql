-- CreateEnum
CREATE TYPE "TriagePriority" AS ENUM ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('UPA', 'CLINIC');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('INFANT', 'CHILD', 'ADULT', 'ELDERLY');

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'RJ',
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "ageYears" INTEGER,
    "gender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "nurseId" TEXT,
    "chiefComplaint" TEXT NOT NULL,
    "painScore" INTEGER,
    "respiratoryRate" INTEGER,
    "heartRate" INTEGER,
    "oxygenSat" INTEGER,
    "temperature" DOUBLE PRECISION,
    "consciousness" TEXT,
    "discriminators" TEXT[],
    "aiSuggestedColor" "TriagePriority",
    "aiConfidence" DOUBLE PRECISION,
    "aiReasoning" JSONB,
    "aiUsed" BOOLEAN NOT NULL DEFAULT false,
    "aiMethod" TEXT,
    "confirmedColor" "TriagePriority" NOT NULL,
    "nurseOverride" BOOLEAN NOT NULL DEFAULT false,
    "arrivalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triageCompletedAt" TIMESTAMP(3),
    "waitMinutes" INTEGER,
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueMetrics" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "currentLoad" INTEGER NOT NULL,
    "loadPercent" DOUBLE PRECISION NOT NULL,
    "avgWaitMinutes" DOUBLE PRECISION NOT NULL,
    "priorityBreakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Facility_isActive_idx" ON "Facility"("isActive");

-- CreateIndex
CREATE INDEX "TriageLog_facilityId_createdAt_idx" ON "TriageLog"("facilityId", "createdAt");

-- CreateIndex
CREATE INDEX "TriageLog_confirmedColor_idx" ON "TriageLog"("confirmedColor");

-- CreateIndex
CREATE INDEX "TriageLog_isSimulated_idx" ON "TriageLog"("isSimulated");

-- CreateIndex
CREATE INDEX "TriageLog_createdAt_idx" ON "TriageLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QueueMetrics_facilityId_key" ON "QueueMetrics"("facilityId");

-- AddForeignKey
ALTER TABLE "TriageLog" ADD CONSTRAINT "TriageLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageLog" ADD CONSTRAINT "TriageLog_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueMetrics" ADD CONSTRAINT "QueueMetrics_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
