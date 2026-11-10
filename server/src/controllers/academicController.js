import { Assignment, Submission } from '../models/Assignment.js';
import { Project } from '../models/Project.js';
import { LabRecord, Seminar } from '../models/LabRecord.js';
import { Resource } from '../models/Resource.js';
import { QuestionPaper } from '../models/QuestionPaper.js';
import { TimetableEntry, Attendance } from '../models/TimetableEntry.js';
import { Notification } from '../models/Note.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendNotificationToUser } from '../services/socketService.js';
import { User } from '../models/User.js';
// --- ASSIGNMENTS ---
export const getAssignments = async (req, res, next) => {
    try {
        const assignments = await Assignment.find().sort({ dueDate: 1 }).populate('createdBy', 'name rollNumber email');
        // Fetch all submissions so all students can see and download shared files
        const allSubmissions = await Submission.find().populate('student', 'name rollNumber email avatar').sort({ submissionDate: -1 });
        const subByAssignment = new Map();
        allSubmissions.forEach((s) => {
            const aId = s.assignment.toString();
            if (!subByAssignment.has(aId)) subByAssignment.set(aId, []);
            subByAssignment.get(aId).push(s);
        });

        const enriched = assignments.map((a) => {
            const doc = a.toObject();
            const subs = subByAssignment.get(a._id.toString()) || [];
            doc.submissions = subs;
            doc.userSubmission = subs.find((s) => s.student?._id?.toString() === req.user?._id?.toString()) || null;
            return doc;
        });
        res.status(200).json({ success: true, count: assignments.length, assignments: enriched });
    }
    catch (err) {
        next(err);
    }
};
export const createAssignment = async (req, res, next) => {
    try {
        const { title, description, subject, subjectCode, dueDate, maxMarks, type, attachments, initialFile } = req.body;
        if (!title || !description || !subject) {
            return next(new AppError('Title, description, and subject are required.', 400));
        }
        const initialAttachments = attachments || [];
        if (initialFile && initialFile.fileName && initialFile.fileUrl) {
            initialAttachments.push({
                fileName: initialFile.fileName,
                fileUrl: initialFile.fileUrl,
                fileType: initialFile.fileType || 'pdf',
                notes: initialFile.notes || 'Original coursework question / reference material',
                uploadedBy: req.user._id,
                uploaderName: req.user.name,
                uploaderRollNumber: req.user.rollNumber,
                uploadedAt: new Date(),
            });
        }
        const assignment = await Assignment.create({
            title,
            description,
            subject,
            subjectCode: subjectCode || '',
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxMarks: maxMarks || 100,
            type: type || 'assignment',
            attachments: initialAttachments,
            createdBy: req.user._id,
            creatorName: req.user.name,
            creatorRollNumber: req.user.rollNumber,
            section: req.user.section || '21',
        });
        // Notify all approved students of new assignment
        const students = await User.find({ role: 'student', status: 'approved' });
        for (const student of students) {
            if (student._id.toString() !== req.user._id.toString()) {
                const notif = await Notification.create({
                    recipient: student._id,
                    title: `New Assignment: ${title}`,
                    message: `${subject} assignment posted by ${req.user.name} (${req.user.rollNumber})`,
                    type: 'assignment',
                    link: '/assignments',
                });
                sendNotificationToUser(student._id.toString(), notif);
            }
        }
        res.status(201).json({ success: true, message: 'Assignment published successfully.', assignment });
    }
    catch (err) {
        next(err);
    }
};
export const submitAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { driveFileId, fileName, fileUrl, fileSize, mimeType, externalLink, notes, fileType } = req.body;
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return next(new AppError('Assignment not found.', 404));
        }
        const finalUrl = fileUrl || externalLink;
        if (!finalUrl) {
            return next(new AppError('Please provide a valid file URL, Google Drive link, or PDF/PPT link.', 400));
        }
        const finalName = fileName || (req.user.name + '_SourceFile.pdf');
        let detectedType = fileType || 'pdf';
        if (finalUrl.toLowerCase().includes('.ppt') || finalUrl.toLowerCase().includes('.pptx')) detectedType = 'ppt';
        else if (finalUrl.toLowerCase().includes('.pdf')) detectedType = 'pdf';
        else if (finalUrl.toLowerCase().includes('drive.google.com')) detectedType = 'drive';

        // Append to assignment attachments so every student in Section 21 can view & download
        assignment.attachments.push({
            fileName: finalName,
            fileUrl: finalUrl,
            fileType: detectedType,
            driveFileId,
            fileSize,
            mimeType,
            notes: notes || '',
            uploadedBy: req.user._id,
            uploaderName: req.user.name,
            uploaderRollNumber: req.user.rollNumber,
            uploadedAt: new Date(),
        });
        await assignment.save();

        // Also record submission record
        const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;
        const submission = await Submission.findOneAndUpdate({ assignment: assignmentId, student: req.user._id }, {
            assignment: assignmentId,
            student: req.user._id,
            driveFileId,
            fileName: finalName,
            fileUrl: finalUrl,
            fileSize,
            mimeType,
            externalLink: finalUrl,
            notes,
            submissionDate: new Date(),
            status: isLate ? 'late' : 'submitted',
        }, { upsert: true, new: true });

        res.status(200).json({
            success: true,
            message: 'Source file uploaded to assignment successfully! Visible to all students in Section 21.',
            assignment,
            submission,
        });
    }
    catch (err) {
        next(err);
    }
};
export const getAssignmentSubmissions = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return next(new AppError('Assignment not found.', 404));
        }
        const submissions = await Submission.find({ assignment: assignmentId })
            .populate('student', 'name rollNumber email avatar')
            .sort({ submissionDate: -1 });
        res.status(200).json({
            success: true,
            count: submissions.length,
            assignmentTitle: assignment.title,
            attachments: assignment.attachments,
            submissions,
        });
    }
    catch (err) {
        next(err);
    }
};
export const gradeSubmission = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;
        const submission = await Submission.findById(submissionId).populate('assignment');
        if (!submission)
            return next(new AppError('Submission not found.', 404));
        submission.grade = grade;
        submission.feedback = feedback || '';
        submission.status = 'graded';
        submission.gradedBy = req.user._id;
        await submission.save();
        const notif = await Notification.create({
            recipient: submission.student,
            title: 'Assignment Graded',
            message: `Your submission for ${submission.assignment.title} was graded: ${grade} marks.`,
            type: 'assignment',
            link: '/assignments',
        });
        sendNotificationToUser(submission.student.toString(), notif);
        res.status(200).json({ success: true, message: 'Submission graded successfully.', submission });
    }
    catch (err) {
        next(err);
    }
};
// --- PROJECTS ---
export const getProjects = async (_req, res, next) => {
    try {
        const projects = await Project.find().populate('leader', 'name rollNumber email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: projects.length, projects });
    }
    catch (err) {
        next(err);
    }
};
export const createProject = async (req, res, next) => {
    try {
        const { title, description, subject, teamMembers, status, deadline, githubUrl, driveFolderId, resources, progressPercentage } = req.body;
        if (!title || !description || !subject) {
            return next(new AppError('Title, description, and subject are required.', 400));
        }
        const project = await Project.create({
            title,
            description,
            subject,
            teamMembers: teamMembers || [{ name: req.user.name, rollNumber: req.user.rollNumber }],
            leader: req.user._id,
            status: status || 'planning',
            deadline,
            githubUrl,
            driveFolderId,
            resources: resources || [],
            progressPercentage: progressPercentage || 0,
            section: req.user.section || '21',
        });
        res.status(201).json({ success: true, message: 'Project created successfully.', project });
    }
    catch (err) {
        next(err);
    }
};
export const updateProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findByIdAndUpdate(projectId, req.body, { new: true });
        if (!project)
            return next(new AppError('Project not found.', 404));
        res.status(200).json({ success: true, message: 'Project updated.', project });
    }
    catch (err) {
        next(err);
    }
};
// --- LAB RECORDS ---
export const getLabRecords = async (req, res, next) => {
    try {
        const { subject } = req.query;
        const filter = {};
        if (subject)
            filter.subject = subject;
        const records = await LabRecord.find(filter).sort({ subject: 1, experimentNumber: 1 });
        res.status(200).json({ success: true, count: records.length, records });
    }
    catch (err) {
        next(err);
    }
};
export const createLabRecord = async (req, res, next) => {
    try {
        const { subject, experimentNumber, experimentName, aim, description, sampleCode, labManualDriveId, labManualUrl, dueDate } = req.body;
        if (!subject || !experimentNumber || !experimentName) {
            return next(new AppError('Subject, experimentNumber, and experimentName are required.', 400));
        }
        const record = await LabRecord.create({
            subject,
            experimentNumber,
            experimentName,
            aim: aim || '',
            description: description || '',
            sampleCode: sampleCode || '',
            labManualDriveId,
            labManualUrl,
            dueDate,
            createdBy: req.user._id,
            section: req.user.section || '21',
        });
        res.status(201).json({ success: true, message: 'Lab record experiment added.', record });
    }
    catch (err) {
        next(err);
    }
};
// --- SEMINARS ---
export const getSeminars = async (_req, res, next) => {
    try {
        const seminars = await Seminar.find().sort({ presentationDate: 1 });
        res.status(200).json({ success: true, count: seminars.length, seminars });
    }
    catch (err) {
        next(err);
    }
};
export const createSeminar = async (req, res, next) => {
    try {
        const { topic, subject, speaker, speakerRollNumber, presentationDate, description, slideDriveFileId, slideUrl, referenceUrls } = req.body;
        if (!topic || !subject || !speaker || !presentationDate) {
            return next(new AppError('Topic, subject, speaker, and presentationDate are required.', 400));
        }
        const seminar = await Seminar.create({
            topic,
            subject,
            speaker,
            speakerRollNumber,
            presentationDate,
            description: description || '',
            slideDriveFileId,
            slideUrl,
            referenceUrls: referenceUrls || [],
            student: req.user._id,
            section: req.user.section || '21',
        });
        res.status(201).json({ success: true, message: 'Seminar scheduled successfully.', seminar });
    }
    catch (err) {
        next(err);
    }
};
// --- SUBJECT RESOURCES (LECTURE & LAB) ---
export const getResources = async (req, res, next) => {
    try {
        const { subject, category, search } = req.query;
        const filter = {};
        if (subject && subject !== 'All')
            filter.subject = subject;
        if (category && category !== 'all')
            filter.category = category;
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
            ];
        }
        const resources = await Resource.find(filter)
            .populate('uploadedBy', 'name rollNumber')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: resources.length, resources });
    }
    catch (err) {
        next(err);
    }
};
export const createResource = async (req, res, next) => {
    try {
        const { title, subject, category, description, unit, driveFileId, fileUrl, fileName, fileSize, mimeType, externalUrl, tags } = req.body;
        if (!title || !subject || !category || !fileName) {
            return next(new AppError('Title, subject, category, and fileName are required.', 400));
        }
        const resource = await Resource.create({
            title,
            subject,
            category,
            description: description || '',
            unit: unit || '',
            uploadedBy: req.user._id,
            driveFileId: driveFileId || '',
            fileUrl: fileUrl || '',
            fileName,
            fileSize: fileSize || 0,
            mimeType: mimeType || 'application/pdf',
            externalUrl: externalUrl || '',
            tags: tags || [],
            section: req.user.section || '21',
        });
        res.status(201).json({ success: true, message: 'Resource shared successfully.', resource });
    }
    catch (err) {
        next(err);
    }
};
// --- QUESTION PAPERS (FA-1 to FA-4, Semester-End) ---
export const getQuestionPapers = async (req, res, next) => {
    try {
        const { subject, examType, academicYear } = req.query;
        const filter = {};
        if (subject && subject !== 'All')
            filter.subject = subject;
        if (examType && examType !== 'all')
            filter.examType = examType;
        if (academicYear)
            filter.academicYear = academicYear;
        const papers = await QuestionPaper.find(filter).sort({ academicYear: -1, examType: 1 });
        res.status(200).json({ success: true, count: papers.length, papers });
    }
    catch (err) {
        next(err);
    }
};
export const createQuestionPaper = async (req, res, next) => {
    try {
        const { subject, subjectCode, examType, academicYear, semester, driveFileId, fileUrl, fileName, fileSize, mimeType, solutionAvailable, solutionDriveFileId, solutionUrl } = req.body;
        if (!subject || !examType || !academicYear || !fileName) {
            return next(new AppError('Subject, examType, academicYear, and fileName are required.', 400));
        }
        const paper = await QuestionPaper.create({
            subject,
            subjectCode: subjectCode || '',
            examType,
            academicYear,
            semester: semester || 'Semester VI',
            driveFileId,
            fileUrl,
            fileName,
            fileSize: fileSize || 0,
            mimeType: mimeType || 'application/pdf',
            solutionAvailable: !!solutionAvailable,
            solutionDriveFileId,
            solutionUrl,
            uploadedBy: req.user._id,
            section: req.user.section || '21',
        });
        res.status(201).json({ success: true, message: 'Question paper archived.', paper });
    }
    catch (err) {
        next(err);
    }
};
// --- TIMETABLE ---
export const getTimetable = async (_req, res, next) => {
    try {
        const entries = await TimetableEntry.find({ section: '21' }).sort({ day: 1, periodNumber: 1 });
        res.status(200).json({ success: true, count: entries.length, timetable: entries });
    }
    catch (err) {
        next(err);
    }
};
export const updateTimetableEntry = async (req, res, next) => {
    try {
        const { day, periodNumber, startTime, endTime, subject, subjectCode, facultyName, roomNumber, type } = req.body;
        if (!day || !periodNumber || !startTime || !endTime || !subject || !facultyName || !roomNumber) {
            return next(new AppError('All timetable entry fields are required.', 400));
        }
        const entry = await TimetableEntry.findOneAndUpdate({ day, periodNumber, section: '21' }, {
            day,
            periodNumber,
            startTime,
            endTime,
            subject,
            subjectCode: subjectCode || '',
            facultyName,
            roomNumber,
            type: type || 'theory',
            section: '21',
        }, { upsert: true, new: true });
        res.status(200).json({ success: true, message: 'Timetable entry updated.', entry });
    }
    catch (err) {
        next(err);
    }
};
// --- ATTENDANCE ---
export const getStudentAttendance = async (req, res, next) => {
    try {
        const studentId = req.query.studentId || req.user._id;
        const records = await Attendance.find({ student: studentId });
        let totalClasses = 0;
        let attendedClasses = 0;
        records.forEach((r) => {
            totalClasses += r.totalClasses;
            attendedClasses += r.attendedClasses;
        });
        const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100 * 10) / 10 : 0;
        // University requires minimum 75% attendance. Calculate safe buffer classes.
        // classes to drop before hitting 75%: attended - 0.75 * total
        const safeBuffer = Math.floor(attendedClasses - 0.75 * totalClasses);
        res.status(200).json({
            success: true,
            attendance: {
                totalClasses,
                attendedClasses,
                overallPercentage,
                safeBuffer,
                minRequired: 75,
                isSafe: overallPercentage >= 75,
                subjectBreakdown: records,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateAttendance = async (req, res, next) => {
    try {
        const { studentId, subject, subjectCode, totalClasses, attendedClasses } = req.body;
        if (!studentId || !subject || totalClasses === undefined || attendedClasses === undefined) {
            return next(new AppError('Student, subject, totalClasses, and attendedClasses are required.', 400));
        }
        const record = await Attendance.findOneAndUpdate({ student: studentId, subject }, {
            student: studentId,
            subject,
            subjectCode: subjectCode || '',
            totalClasses,
            attendedClasses,
            lastUpdated: new Date(),
        }, { upsert: true, new: true });
        res.status(200).json({ success: true, message: 'Attendance updated.', record });
    }
    catch (err) {
        next(err);
    }
};
