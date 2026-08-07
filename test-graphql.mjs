import { config } from 'dotenv';
config({ path: 'apps/web/.env.local' });

const account = process.env.SHELBY_ACCOUNT_ADDRESS;
const indexerUrl = "https://api.testnet.aptoslabs.com/nocode/v1/public/cmlfqs5wt00qrs601zt5s4kfj/v1/graphql";

const query = `
  query GetBlobs($account: String!, $limit: Int!) {
    Blobs(
      where: { account: { _eq: $account } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      blob_name
      created_at
    }
  }
`;

async function test() {
  console.log("Account:", account);
  try {
    const res = await fetch(indexerUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SHELBY_API_KEY}`
      },
      body: JSON.stringify({
        query,
        variables: { account, limit: 10 }
      })
    });
    
    if (!res.ok) {
      console.error("HTTP error", res.status, await res.text());
      return;
    }
    const { data, errors } = await res.json();
    if (errors) {
      console.error("GraphQL errors:", errors);
    } else {
      console.log("Blobs found:", data.Blobs.length);
      console.log(JSON.stringify(data.Blobs, null, 2));
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
