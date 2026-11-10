import { Note, Reminder } from '../models/Note.js';
import { AppError } from '../middleware/errorHandler.js';
// --- PERSONAL NOTES ---
export const getNotes = async (req, res, next) => {
    try {
        const { search, tag } = req.query;
        const filter = { user: req.user._id };
        if (tag)
            filter.tags = tag;
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { content: new RegExp(search, 'i') },
            ];
        }
        const notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });
        res.status(200).json({ success: true, count: notes.length, notes });
    }
    catch (err) {
        next(err);
    }
};
export const createNote = async (req, res, next) => {
    try {
        const { title, content, tags, subject, color, isPinned } = req.body;
        if (!title || !content) {
            return next(new AppError('Title and content are required.', 400));
        }
        const note = await Note.create({
            user: req.user._id,
            title,
            content,
            tags: tags || [],
            subject: subject || '',
            color: color || '#FFFFFF',
            isPinned: !!isPinned,
        });
        res.status(201).json({ success: true, message: 'Note saved.', note });
    }
    catch (err) {
        next(err);
    }
};
export const updateNote = async (req, res, next) => {
    try {
        const { noteId } = req.params;
        const note = await Note.findOneAndUpdate({ _id: noteId, user: req.user._id }, req.body, { new: true });
        if (!note)
            return next(new AppError('Note not found.', 404));
        res.status(200).json({ success: true, message: 'Note updated.', note });
    }
    catch (err) {
        next(err);
    }
};
export const deleteNote = async (req, res, next) => {
    try {
        const { noteId } = req.params;
        const note = await Note.findOneAndDelete({ _id: noteId, user: req.user._id });
        if (!note)
            return next(new AppError('Note not found.', 404));
        res.status(200).json({ success: true, message: 'Note deleted.' });
    }
    catch (err) {
        next(err);
    }
};
// --- REMINDERS ---
export const getReminders = async (req, res, next) => {
    try {
        const reminders = await Reminder.find({ user: req.user._id }).sort({ isCompleted: 1, dueDate: 1 });
        res.status(200).json({ success: true, count: reminders.length, reminders });
    }
    catch (err) {
        next(err);
    }
};
export const createReminder = async (req, res, next) => {
    try {
        const { title, description, dueDate, priority, relatedModule } = req.body;
        if (!title || !dueDate) {
            return next(new AppError('Title and due date are required for a reminder.', 400));
        }
        const reminder = await Reminder.create({
            user: req.user._id,
            title,
            description: description || '',
            dueDate,
            priority: priority || 'medium',
            relatedModule: relatedModule || 'personal',
        });
        res.status(201).json({ success: true, message: 'Reminder created.', reminder });
    }
    catch (err) {
        next(err);
    }
};
export const toggleReminder = async (req, res, next) => {
    try {
        const { reminderId } = req.params;
        const reminder = await Reminder.findOne({ _id: reminderId, user: req.user._id });
        if (!reminder)
            return next(new AppError('Reminder not found.', 404));
        reminder.isCompleted = !reminder.isCompleted;
        await reminder.save();
        res.status(200).json({ success: true, message: 'Reminder toggled.', reminder });
    }
    catch (err) {
        next(err);
    }
};
export const deleteReminder = async (req, res, next) => {
    try {
        const { reminderId } = req.params;
        const reminder = await Reminder.findOneAndDelete({ _id: reminderId, user: req.user._id });
        if (!reminder)
            return next(new AppError('Reminder not found.', 404));
        res.status(200).json({ success: true, message: 'Reminder deleted.' });
    }
    catch (err) {
        next(err);
    }
};
