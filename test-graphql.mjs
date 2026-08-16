/**
 * ShelbyNet storage audit.
 *
 * Lists the account's blobs from the shelbynet indexer and checks that each
 * committed blob is actually readable over HTTP. Uncommitted blobs answer 404,
 * so they must never be surfaced as audio URLs in the app.
 *
 * Usage: node test-graphql.mjs
 */
import { readFileSync } from 'fs';

// Minimal .env loader so this script has no dependencies of its own.
for (const file of ['apps/web/.env.local', '.env']) {
  try {
    for (const line of readFileSync(new URL(file, import.meta.url), 'utf8').split('\n')) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
    }
  } catch { /* file is optional */ }
}

const account = process.env.SHELBY_ACCOUNT_ADDRESS;
if (!account) {
  console.error('SHELBY_ACCOUNT_ADDRESS not set');
  process.exit(1);
}

const INDEXER_URL = 'https://api.shelbynet.shelby.xyz/v1/graphql';
const RPC_BASE = 'https://api.shelbynet.shelby.xyz/shelby';

const query = `
  query GetBlobs($account: String!, $limit: Int!) {
    blobs(
      where: { owner: { _eq: $account } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      uid
      object_name
      size
      created_at
      is_committed
      is_deleted
    }
  }
`;

function toBlobName(objectName) {
  return objectName.startsWith('@')
    ? objectName.slice(objectName.indexOf('/') + 1)
    : objectName;
}

function publicUrl(blobName) {
  const encoded = blobName.split('/').map(encodeURIComponent).join('/');
  return `${RPC_BASE}/v1/blobs/${account}/${encoded}`;
}

const res = await fetch(INDEXER_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { account, limit: 20 } }),
});

if (!res.ok) {
  console.error('Indexer HTTP error', res.status, await res.text());
  process.exit(1);
}

const { data, errors } = await res.json();
if (errors) {
  console.error('GraphQL errors:', JSON.stringify(errors, null, 2));
  process.exit(1);
}

const blobs = data?.blobs ?? [];
console.log(`Account : ${account}`);
console.log(`Network : shelbynet`);
console.log(`Blobs   : ${blobs.length}\n`);

let committed = 0;
let readable = 0;

for (const b of blobs) {
  const blobName = toBlobName(b.object_name);
  const url = publicUrl(blobName);
  const isCommitted = b.is_committed === 1 && b.is_deleted === 0;
  if (isCommitted) committed++;

  let status = 'skipped (uncommitted)';
  if (isCommitted) {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      status = `HTTP ${head.status}`;
      if (head.ok) readable++;
    } catch (e) {
      status = `fetch failed: ${e.message}`;
    }
  }

  console.log(`${isCommitted ? '✓' : '·'} ${blobName}`);
  console.log(`    ${(b.size / 1024).toFixed(0)} KB | committed=${b.is_committed} | ${status}`);
}

console.log(`\nCommitted: ${committed}/${blobs.length}   Readable: ${readable}/${committed}`);
if (committed > 0 && readable === committed) {
  console.log('OK — every committed blob is served from Shelby.');
}
