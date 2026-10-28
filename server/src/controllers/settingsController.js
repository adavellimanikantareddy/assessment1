import { getOrganizationSettings, updateOrganizationSettings } from '../services/settingsService.js';

export const getSettings = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const settings = await getOrganizationSettings(organizationId);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { defaultLowStockThreshold } = req.body;

    if (defaultLowStockThreshold === undefined || defaultLowStockThreshold === null) {
      return res.status(400).json({ error: 'defaultLowStockThreshold is required.' });
    }

    const settings = await updateOrganizationSettings({
      organizationId,
      defaultLowStockThreshold,
    });

    res.json({
      message: 'Settings updated successfully.',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

