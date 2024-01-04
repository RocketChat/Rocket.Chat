import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { migrateDatabase, onServerVersionChange } from '../../lib/migrations';
import { ensureCloudWorkspaceRegistered } from '../cloudRegistration';

const { MIGRATION_VERSION = 'latest' } = process.env;

const [version, ...subcommands] = MIGRATION_VERSION.split(',');

await migrateDatabase(version === 'latest' ? version : parseInt(version), subcommands);

// perform operations when the server is starting with a different version
await onServerVersionChange(async () => {
	await upsertPermissions();
	await ensureCloudWorkspaceRegistered();
});
