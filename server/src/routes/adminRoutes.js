import { Router } from 'express';
import { getPendingUsers, approveUser, rejectUser, updateUserStatus, getAllUsers, getAdminStats, postAnnouncement, } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
const router = Router();
// Protect all admin routes with authentication and admin role verification
router.use(authenticate, requireAdmin);
router.get('/pending-users', getPendingUsers);
router.post('/approve-user/:userId', approveUser);
router.post('/reject-user/:userId', rejectUser);
router.put('/user-status/:userId', updateUserStatus);
router.get('/users', getAllUsers);
router.get('/stats', getAdminStats);
router.post('/announcements', postAnnouncement);
export default router;
