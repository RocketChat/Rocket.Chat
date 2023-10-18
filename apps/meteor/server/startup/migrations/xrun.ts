import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { migrateDatabase, onServerVersionChange } from '../../lib/migrations';

const { MIGRATION_VERSION = 'latest' } = process.env;

const [version, ...subcommands] = MIGRATION_VERSION.split(',');

await migrateDatabase(version === 'latest' ? version : parseInt(version), subcommands);

// if the server is starting with a different version we update the permissions
await onServerVersionChange(() => upsertPermissions());
