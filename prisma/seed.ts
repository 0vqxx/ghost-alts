import { seedDatabase } from '../src/lib/seed';

seedDatabase()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
