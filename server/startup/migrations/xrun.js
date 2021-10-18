import { migrateDatabase } from '../../lib/migrations';

const {
	MIGRATION_VERSION = 'latest',
} = process.env;

const [version, ...subcommands] = MIGRATION_VERSION.split(',');

migrateDatabase(version === 'latest' ? version : parseInt(version), subcommands);
