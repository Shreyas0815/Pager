// Notification Gateway - Simulates push notifications (FCM/APNs)
class NotificationGateway {
  constructor(prisma, wsHandler) {
    this.prisma = prisma;
    this.wsHandler = wsHandler;
    this.sentCount = 0;
  }

  async sendCriticalAlert(alert, patient) {
    try {
      // Find assigned staff for this patient
      const assignments = await this.prisma.staffAssignment.findMany({
        where: { patientId: patient.id },
        include: { staff: true },
      });

      for (const assignment of assignments) {
        const notification = await this.prisma.notification.create({
          data: {
            userId: assignment.staffId,
            alertId: alert.id,
            title: `🚨 CRITICAL ALERT - ${patient.name}`,
            body: alert.message,
            type: 'ALERT',
          },
        });

        // Push via WebSocket to the specific user's connected devices
        this.wsHandler.broadcastToUser(assignment.staffId, {
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            alertId: alert.id,
            patientId: patient.id,
            patientName: patient.name,
            bedNumber: patient.bedNumber,
            severity: alert.severity,
            timestamp: notification.createdAt.toISOString(),
          },
        });

        this.sentCount++;
        console.log(`[NotificationGateway] Push sent to ${assignment.staff.name} (${assignment.role}): ${alert.message}`);
      }

      // Also broadcast to all admin users
      // In production, this would go through FCM/APNs
      console.log(`[NotificationGateway] 📱 Simulated FCM/APNs push for ${assignments.length} staff members`);
    } catch (err) {
      console.error('[NotificationGateway] Error sending notification:', err.message);
    }
  }

  async sendInfoNotification(userId, title, body) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: 'INFO',
        },
      });

      this.wsHandler.broadcastToUser(userId, {
        type: 'notification',
        data: notification,
      });

      this.sentCount++;
    } catch (err) {
      console.error('[NotificationGateway] Error sending info notification:', err.message);
    }
  }

  getStats() {
    return {
      sentCount: this.sentCount,
      status: 'RUNNING',
    };
  }
}

module.exports = NotificationGateway;
