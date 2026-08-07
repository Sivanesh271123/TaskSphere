import NotificationModel from '../models/notificationModel.js';

export async function getNotifications(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const notifications = await NotificationModel.getAllByUser(req.user.id, limit, offset);
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await NotificationModel.getUnreadCount(req.user.id);
    res.json(count);
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
}

export async function createNotification(req, res) {
  try {
    const { message, type, taskId, title } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const notification = await NotificationModel.create(req.user.id, { 
      message: message.trim(), 
      type, 
      taskId, 
      title 
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error('createNotification error:', err);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
}

export async function markAsRead(req, res) {
  try {
    await NotificationModel.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await NotificationModel.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
}

export async function deleteNotification(req, res) {
  try {
    await NotificationModel.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
}

/**
 * Controller to trigger a sample test email via Nodemailer
 */
export async function sendTestEmailController(req, res) {
  try {
    const toEmail = req.body.to || req.user?.email;
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid recipient email address in request body.' });
    }

    const EmailService = (await import('../services/emailService.js')).default;
    const info = await EmailService.sendTestEmail(toEmail);

    res.json({
      success: true,
      message: `Sample test email sent successfully to ${toEmail}`,
      messageId: info?.messageId
    });
  } catch (err) {
    console.error('sendTestEmailController error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send test email.'
    });
  }
}
