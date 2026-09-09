import { prisma } from '../src/lib/prisma';

async function testDatabase() {
  const orderCount = await prisma.order.count();
  const layawayCount = await prisma.layawayContract.count();
  const paymentCount = await prisma.payment.count();
  const installmentCount = await prisma.installment.count();

  console.log('Database Status:');
  console.log('Orders:', orderCount);
  console.log('Layaway Contracts:', layawayCount);
  console.log('Payments:', paymentCount);
  console.log('Installments:', installmentCount);
}

testDatabase()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
