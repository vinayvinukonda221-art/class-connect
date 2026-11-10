import { User } from '../models/User.js';
import { Assignment, Submission } from '../models/Assignment.js';
import { LabRecord, Seminar } from '../models/LabRecord.js';
import { Resource } from '../models/Resource.js';
import { QuestionPaper } from '../models/QuestionPaper.js';
import { TimetableEntry, Attendance } from '../models/TimetableEntry.js';
import { Project } from '../models/Project.js';
import { Note, Reminder, TemporaryMessage, Notification } from '../models/Note.js';
import { GoogleDriveConnection } from '../models/GoogleDriveConnection.js';
import { ENV } from '../config/env.js';

export const clearAllDemoData = async () => {
  try {
    console.log('Purging all demo content for a clean, fresh system...');
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await LabRecord.deleteMany({});
    await Seminar.deleteMany({});
    await Resource.deleteMany({});
    await QuestionPaper.deleteMany({});
    await TimetableEntry.deleteMany({});
    await Attendance.deleteMany({});
    await Project.deleteMany({});
    await Note.deleteMany({});
    await Reminder.deleteMany({});
    await TemporaryMessage.deleteMany({});
    await Notification.deleteMany({});
    await GoogleDriveConnection.deleteMany({});
    console.log('Zero demo data: all students, assignments, timetable, records, and messages purged.');
  } catch (err) {
    console.error('Error clearing demo data:', err.message);
  }
};

export const seedInitialData = async () => {
  try {
    // 1. Purge all demo students, submissions, assignments, records, etc.
    await clearAllDemoData();

    // 2. Initial Administrator Account Provisioning / Sync
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Provisioning primary administrator account for CSE Section 21...');
      admin = await User.create({
        name: ENV.INITIAL_ADMIN.name,
        email: ENV.INITIAL_ADMIN.email,
        rollNumber: ENV.INITIAL_ADMIN.rollNumber,
        contactNumber: ENV.INITIAL_ADMIN.contactNumber,
        section: ENV.ALLOWED_SECTION,
        password: ENV.INITIAL_ADMIN.password,
        role: 'admin',
        status: 'approved',
        department: ENV.DEPARTMENT_NAME,
        university: ENV.UNIVERSITY_NAME,
        bio: 'Chief Academic Coordinator & Section 21 Administrator, VFSTR.',
      });
      console.log(`Primary Administrator provisioned: ${admin.email}`);
    } else {
      admin.name = ENV.INITIAL_ADMIN.name;
      admin.email = ENV.INITIAL_ADMIN.email;
      admin.rollNumber = ENV.INITIAL_ADMIN.rollNumber;
      admin.contactNumber = ENV.INITIAL_ADMIN.contactNumber;
      admin.password = ENV.INITIAL_ADMIN.password;
      await admin.save();
      console.log(`Primary Administrator updated: ${admin.email}`);
    }

    console.log('Fresh environment ready: Ready for new student registrations and admin management.');
  } catch (error) {
    console.error('Initial setup failed:', error.message);
  }
};
