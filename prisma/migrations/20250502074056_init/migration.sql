-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'manager', 'staff', 'accountant', 'mentor');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "StudentGender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateEnum
CREATE TYPE "CalendarDayType" AS ENUM ('holiday', 'exam_day', 'special_event', 'teacher_workday', 'shortened_day');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('daily', 'weekly', 'monthly', 'custom', 'class_based', 'student_based');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "profilePhoto" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'mentor',
    "verificationToken" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdBy" TEXT,
    "lastLogin" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bio" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disabledAt" TIMESTAMP(3),
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT,
    "city" TEXT,
    "province" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "village" TEXT,
    "road" TEXT,
    "postalCode" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "title" TEXT,
    "nfcLoginToken" TEXT,
    "nfcLoginTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "studentId" VARCHAR(12) NOT NULL,
    "cardId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "profilePhoto" TEXT,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "StudentGender",
    "country" TEXT,
    "city" TEXT,
    "province" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "village" TEXT,
    "road" TEXT,
    "postalCode" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "classId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "section" TEXT,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'computer',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "bgColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'absent',
    "tapTime" TIMESTAMP(3),
    "reason" TEXT,
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_attendance_config" (
    "id" TEXT NOT NULL,
    "openTime" TEXT NOT NULL DEFAULT '05:00:00',
    "lateThreshold" TEXT NOT NULL DEFAULT '08:00:00',
    "closeTime" TEXT NOT NULL DEFAULT '17:00:00',
    "weekendDays" TEXT[] DEFAULT ARRAY['saturday', 'sunday']::TEXT[],
    "graceMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_attendance_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_calendar" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarDayType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_reports" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "classId" TEXT,
    "reportType" "ReportType" NOT NULL,
    "generatedBy" TEXT,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_cardId_key" ON "students"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_key" ON "classes"("name");

-- CreateIndex
CREATE INDEX "classes_level_idx" ON "classes"("level");

-- CreateIndex
CREATE INDEX "classes_section_idx" ON "classes"("section");

-- CreateIndex
CREATE INDEX "classes_level_section_idx" ON "classes"("level", "section");

-- CreateIndex
CREATE INDEX "classes_color_idx" ON "classes"("color");

-- CreateIndex
CREATE INDEX "classes_icon_idx" ON "classes"("icon");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_date_key" ON "attendances"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "school_calendar_date_key" ON "school_calendar"("date");

-- CreateIndex
CREATE INDEX "school_calendar_date_idx" ON "school_calendar"("date");

-- CreateIndex
CREATE INDEX "school_calendar_type_idx" ON "school_calendar"("type");

-- CreateIndex
CREATE INDEX "attendance_reports_reportDate_idx" ON "attendance_reports"("reportDate");

-- CreateIndex
CREATE INDEX "attendance_reports_classId_idx" ON "attendance_reports"("classId");

-- CreateIndex
CREATE INDEX "attendance_reports_reportType_idx" ON "attendance_reports"("reportType");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
