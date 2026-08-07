import { config } from 'dotenv';
config({ path: 'apps/web/.env.local' });
// Set Vercel to false to ensure we hit the SQLite branch locally if needed
// But actually useSupabase returns true if VERCEL is true.
// Here we want to test sqlite path, which is default.

async function test() {
  const { getRecentRingtones } = await import('./apps/web/lib/storage.ts');
  console.log("STORAGE_PROVIDER:", process.env.STORAGE_PROVIDER);
  console.log("Fetching recent ringtones...");
  try {
    const ringtones = await getRecentRingtones(10);
    console.log("Ringtones found:", ringtones.length);
    console.log(ringtones);
  } catch (err) {
    console.error(err);
  }
}
test();
