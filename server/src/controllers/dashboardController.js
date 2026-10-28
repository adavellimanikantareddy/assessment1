import { getDashboardStats } from '../services/dashboardService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const stats = await getDashboardStats(organizationId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

