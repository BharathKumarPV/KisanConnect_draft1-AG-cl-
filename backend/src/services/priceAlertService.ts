import { prisma } from '../lib/prisma';

export async function checkAndTriggerAlerts(): Promise<void> {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: {
      commodity: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });

  for (const alert of activeAlerts) {
    try {
      // Get latest modal price for this commodity (optionally filtered by market)
      const latestPrice = await prisma.marketPrice.findFirst({
        where: {
          commodityId: alert.commodityId,
          ...(alert.marketId ? { marketId: alert.marketId } : {}),
        },
        orderBy: { priceDate: 'desc' },
        select: { modalPrice: true, priceDate: true },
      });

      if (!latestPrice) continue;

      const triggered =
        alert.condition === 'ABOVE'
          ? latestPrice.modalPrice > alert.targetPrice
          : latestPrice.modalPrice < alert.targetPrice;

      if (triggered) {
        // Check if we already notified recently (within 24 hours)
        const recentNotification = await prisma.notification.findFirst({
          where: {
            userId: alert.userId,
            type: 'PRICE_ALERT',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            data: { contains: alert.id },
          },
        });

        if (!recentNotification) {
          const direction = alert.condition === 'ABOVE' ? 'risen above' : 'fallen below';
          await prisma.notification.create({
            data: {
              userId: alert.userId,
              type: 'PRICE_ALERT',
              title: `Price Alert: ${alert.commodity.name}`,
              message: `The price of ${alert.commodity.name} has ${direction} ₹${alert.targetPrice}/Quintal. Current modal price: ₹${latestPrice.modalPrice}/Quintal as of ${latestPrice.priceDate.toLocaleDateString('en-IN')}.`,
              data: JSON.stringify({ alertId: alert.id, commodityId: alert.commodityId }),
            },
          });

          // Update last triggered
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { lastTriggered: new Date() },
          });
        }
      }
    } catch (err) {
      console.error(`[AlertService] Error checking alert ${alert.id}:`, err);
    }
  }
}
