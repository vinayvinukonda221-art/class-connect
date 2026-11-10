import cron from 'node-cron';
import { TemporaryMessage } from '../models/Note.js';
import { Assignment } from '../models/Assignment.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Note.js';
import { sendNotificationToUser } from './socketService.js';
export const initCronJobs = () => {
    console.log('Initializing scheduled background tasks...');
    // 1. Purge expired temporary messages every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            const now = new Date();
            const result = await TemporaryMessage.deleteMany({ expiresAt: { $lt: now } });
            if (result.deletedCount > 0) {
                console.log(`[Cron Task] Purged ${result.deletedCount} expired temporary messages.`);
            }
        }
        catch (err) {
            console.error('[Cron Task Error] Message cleanup error:', err.message);
        }
    });
    // 2. Daily Assignment Due Date Reminder check at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        try {
            const now = new Date();
            const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const dueAssignments = await Assignment.find({
                status: 'active',
                dueDate: { $gte: now, $lte: next24h },
            });
            if (dueAssignments.length === 0)
                return;
            const sectionStudents = await User.find({ role: 'student', status: 'approved' });
            for (const assignment of dueAssignments) {
                for (const student of sectionStudents) {
                    const notif = await Notification.create({
                        recipient: student._id,
                        title: `Due Soon: ${assignment.title}`,
                        message: `Assignment for ${assignment.subject} is due in less than 24 hours (${assignment.dueDate.toLocaleTimeString()}).`,
                        type: 'assignment',
                        link: `/assignments`,
                    });
                    sendNotificationToUser(student._id.toString(), notif);
                }
            }
            console.log(`[Cron Task] Sent reminders for ${dueAssignments.length} upcoming assignments.`);
        }
        catch (err) {
            console.error('[Cron Task Error] Assignment alert error:', err.message);
        }
    });
    console.log('Scheduled tasks registered successfully.');
};
