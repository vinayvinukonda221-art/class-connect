import { Router } from 'express';
import { getAssignments, createAssignment, submitAssignment, getAssignmentSubmissions, gradeSubmission, getProjects, createProject, updateProject, getLabRecords, createLabRecord, getSeminars, createSeminar, getResources, createResource, getQuestionPapers, createQuestionPaper, getTimetable, updateTimetableEntry, getStudentAttendance, updateAttendance, } from '../controllers/academicController.js';
import { authenticate, requireApproved, requireAdmin } from '../middleware/auth.js';
const router = Router();
// All academic routes require logged-in and approved status
router.use(authenticate, requireApproved);
// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.post('/assignments/:assignmentId/submit', submitAssignment);
router.post('/assignments/:assignmentId/files', submitAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.post('/submissions/:submissionId/grade', requireAdmin, gradeSubmission);
// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:projectId', updateProject);
// Lab Records
router.get('/lab-records', getLabRecords);
router.post('/lab-records', requireAdmin, createLabRecord);
// Seminars
router.get('/seminars', getSeminars);
router.post('/seminars', createSeminar);
// Subject Resources
router.get('/resources', getResources);
router.post('/resources', createResource);
// Question Papers (PYQ FA-1 to FA-4)
router.get('/question-papers', getQuestionPapers);
router.post('/question-papers', createQuestionPaper);
// Timetable
router.get('/timetable', getTimetable);
router.post('/timetable', requireAdmin, updateTimetableEntry);
// Attendance
router.get('/attendance', getStudentAttendance);
router.post('/attendance', requireAdmin, updateAttendance);
export default router;
