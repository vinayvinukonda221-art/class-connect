import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote, getReminders, createReminder, toggleReminder, deleteReminder, } from '../controllers/notesAndRemindersController.js';
import { authenticate, requireApproved } from '../middleware/auth.js';
const router = Router();
router.use(authenticate, requireApproved);
// Notes
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.put('/notes/:noteId', updateNote);
router.delete('/notes/:noteId', deleteNote);
// Reminders
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.patch('/reminders/:reminderId/toggle', toggleReminder);
router.delete('/reminders/:reminderId', deleteReminder);
export default router;
