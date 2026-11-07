// Creates the database and containers in the local Cosmos emulator, matching infra/main.bicep.
// Only for local development: in Azure the Bicep template creates them.
//   node scripts/init-local-db.js   (reads api/local.settings.json)
import { readFileSync } from 'node:fs';
import { CosmosClient } from '@azure/cosmos';

const settings = JSON.parse(readFileSync(new URL('../local.settings.json', import.meta.url), 'utf8')).Values;
const endpoint = settings.COSMOS_ENDPOINT;
if (!/localhost|127\.0\.0\.1/.test(endpoint)) {
  console.error(`Refusing to run against ${endpoint}: this script is for the local emulator only.`);
  process.exit(1);
}
const client = new CosmosClient({ endpoint, key: settings.COSMOS_KEY });
const { database } = await client.databases.createIfNotExists({ id: settings.COSMOS_DATABASE || 'society' });
for (const [id, path] of [['users', '/id'], ['characters', '/ownerId'], ['notes', '/ownerId'], ['campaigns', '/campaignId']]) {
  await database.containers.createIfNotExists({ id, partitionKey: { paths: [path] } });
  console.log(`✓ ${id} (${path})`);
}
