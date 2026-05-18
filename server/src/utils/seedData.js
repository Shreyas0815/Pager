const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('[Seed] Starting database seed...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // Create Staff
  const admin = await prisma.user.create({
    data: { name: 'Dr. Admin', email: 'admin@hospital.com', password, role: 'ADMIN', department: 'Administration', phone: '+1-555-0100' },
  });

  const drSmith = await prisma.user.create({
    data: { name: 'Dr. Sarah Smith', email: 'sarah.smith@hospital.com', password, role: 'DOCTOR', department: 'Cardiology', phone: '+1-555-0101' },
  });

  const drJones = await prisma.user.create({
    data: { name: 'Dr. Michael Jones', email: 'michael.jones@hospital.com', password, role: 'DOCTOR', department: 'Internal Medicine', phone: '+1-555-0102' },
  });

  const drPatel = await prisma.user.create({
    data: { name: 'Dr. Priya Patel', email: 'priya.patel@hospital.com', password, role: 'DOCTOR', department: 'Pulmonology', phone: '+1-555-0103' },
  });

  const nurseWilson = await prisma.user.create({
    data: { name: 'Nurse Emily Wilson', email: 'emily.wilson@hospital.com', password, role: 'NURSE', department: 'ICU', phone: '+1-555-0201' },
  });

  const nurseGarcia = await prisma.user.create({
    data: { name: 'Nurse Carlos Garcia', email: 'carlos.garcia@hospital.com', password, role: 'NURSE', department: 'ICU', phone: '+1-555-0202' },
  });

  const nurseLee = await prisma.user.create({
    data: { name: 'Nurse Jessica Lee', email: 'jessica.lee@hospital.com', password, role: 'NURSE', department: 'General Ward', phone: '+1-555-0203' },
  });

  console.log('[Seed] Created 7 staff members');

  // Create Patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: 'John Anderson', age: 67, gender: 'MALE', bedNumber: 'ICU-01', ward: 'ICU',
        diagnosis: 'Acute Myocardial Infarction', status: 'CRITICAL',
        thresholdHRHigh: 160, thresholdHRLow: 45,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Maria Gonzalez', age: 54, gender: 'FEMALE', bedNumber: 'ICU-02', ward: 'ICU',
        diagnosis: 'Severe Pneumonia', status: 'WARNING',
        thresholdSpO2Low: 88,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Robert Chen', age: 72, gender: 'MALE', bedNumber: 'ICU-03', ward: 'ICU',
        diagnosis: 'Post CABG Surgery', status: 'STABLE',
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Emily Thompson', age: 45, gender: 'FEMALE', bedNumber: 'ICU-04', ward: 'ICU',
        diagnosis: 'Pulmonary Embolism', status: 'WARNING',
        thresholdSpO2Low: 90, thresholdHRHigh: 150,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'James Wilson', age: 38, gender: 'MALE', bedNumber: 'GW-01', ward: 'General',
        diagnosis: 'Post Appendectomy', status: 'STABLE',
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Sarah Kim', age: 61, gender: 'FEMALE', bedNumber: 'GW-02', ward: 'General',
        diagnosis: 'Type 2 Diabetes Monitoring', status: 'STABLE',
      },
    }),
    prisma.patient.create({
      data: {
        name: 'David O\'Brien', age: 79, gender: 'MALE', bedNumber: 'GW-03', ward: 'General',
        diagnosis: 'Congestive Heart Failure', status: 'WARNING',
        thresholdHRHigh: 140, thresholdBPSysHigh: 170,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Aisha Patel', age: 33, gender: 'FEMALE', bedNumber: 'GW-04', ward: 'General',
        diagnosis: 'Post C-Section Recovery', status: 'STABLE',
      },
    }),
  ]);

  console.log(`[Seed] Created ${patients.length} patients`);

  // Create Equipment
  const equipmentData = [];
  const equipTypes = [
    { type: 'ECG', name: 'ECG Monitor' },
    { type: 'HEART_RATE_MONITOR', name: 'Heart Rate Monitor' },
    { type: 'SPO2_SENSOR', name: 'SpO2 Sensor' },
    { type: 'BP_MONITOR', name: 'Blood Pressure Monitor' },
    { type: 'TEMP_SENSOR', name: 'Temperature Sensor' },
  ];

  for (const patient of patients) {
    for (const equip of equipTypes) {
      equipmentData.push({
        name: `${equip.name} - ${patient.bedNumber}`,
        type: equip.type,
        serialNumber: `SN-${equip.type}-${patient.bedNumber}-${Math.floor(Math.random() * 10000)}`,
        bedNumber: patient.bedNumber,
        patientId: patient.id,
        status: Math.random() > 0.05 ? 'ONLINE' : 'OFFLINE',
      });
    }
  }

  await prisma.equipment.createMany({ data: equipmentData });
  console.log(`[Seed] Created ${equipmentData.length} equipment devices`);

  // Create Staff Assignments
  const assignmentData = [
    // ICU patients
    { staffId: drSmith.id, patientId: patients[0].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseWilson.id, patientId: patients[0].id, role: 'ATTENDING_NURSE' },
    { staffId: drSmith.id, patientId: patients[1].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseGarcia.id, patientId: patients[1].id, role: 'ATTENDING_NURSE' },
    { staffId: drJones.id, patientId: patients[2].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseWilson.id, patientId: patients[2].id, role: 'ATTENDING_NURSE' },
    { staffId: drPatel.id, patientId: patients[3].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseGarcia.id, patientId: patients[3].id, role: 'ATTENDING_NURSE' },
    // General ward patients
    { staffId: drJones.id, patientId: patients[4].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseLee.id, patientId: patients[4].id, role: 'ATTENDING_NURSE' },
    { staffId: drPatel.id, patientId: patients[5].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseLee.id, patientId: patients[5].id, role: 'ATTENDING_NURSE' },
    { staffId: drSmith.id, patientId: patients[6].id, role: 'CONSULTANT' },
    { staffId: drJones.id, patientId: patients[6].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseLee.id, patientId: patients[6].id, role: 'ATTENDING_NURSE' },
    { staffId: drJones.id, patientId: patients[7].id, role: 'PRIMARY_DOCTOR' },
    { staffId: nurseLee.id, patientId: patients[7].id, role: 'ATTENDING_NURSE' },
  ];

  await prisma.staffAssignment.createMany({ data: assignmentData });
  console.log(`[Seed] Created ${assignmentData.length} staff assignments`);

  console.log('[Seed] ✅ Database seeded successfully!');
  console.log('\n--- Login Credentials ---');
  console.log('Admin:  admin@hospital.com / password123');
  console.log('Doctor: sarah.smith@hospital.com / password123');
  console.log('Doctor: michael.jones@hospital.com / password123');
  console.log('Nurse:  emily.wilson@hospital.com / password123');
  console.log('------------------------\n');

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
