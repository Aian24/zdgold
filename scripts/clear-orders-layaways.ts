import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('🧹 Cleaning all orders, layaway contracts, installments, and payment records...');
  
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.layawayContract.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.activityLog.deleteMany();

  console.log('✅ Successfully cleared all orders and layaway records!');
}

clearData()
  .catch((e) => {
    console.error('Error clearing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
