// Synthetic demo users for the LOCAL DEMONSTRATION only.
// Passwords are documented (and inspectable) for the demo. They hash via bcrypt
// to populate the User.passwordHash column.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
// Single source of truth for accounts (see packages/shared-types). The portal's
// demo-account panel consumes the same array, so the two cannot drift.
import { DEMO_ACCOUNTS } from '../../shared-types';

const prisma = new PrismaClient();

async function main() {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const user = await prisma.user.upsert({
      where: { email: account.username },
      update: {}, // Existing accounts are preserved; setup never resets their credentials or role.
      create: {
        email: account.username,
        name: account.name,
        role: account.role,
        isActive: true,
        passwordHash,
      },
    });
    console.log(`  seeded ${user.email} (${user.role})`);
  }
  console.log(`Seeded ${DEMO_ACCOUNTS.length} demo users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
