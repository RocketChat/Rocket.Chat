export type MongoUrlAssumption = {
	filePath: string;
	kind: 'framework-managed' | 'explicit-default' | 'pass-through';
	details: string;
};

export const MONGO_URL_ASSUMPTIONS: MongoUrlAssumption[] = [
	{
		filePath: 'apps/meteor/package.json',
		kind: 'framework-managed',
		details:
			'Dev scripts (`dev`, `dsv`, `ms`) run Meteor without wiring `MONGO_URL`, relying on framework-managed local Mongo provisioning.',
	},
	{
		filePath: 'apps/meteor/.scripts/run-ha.ts',
		kind: 'explicit-default',
		details: 'Sets `MONGO_URL` to `mongodb://localhost:3001/meteor` for HA helper workflows.',
	},
	{
		filePath: 'apps/meteor/ee/server/services/README.md',
		kind: 'explicit-default',
		details: 'Documents service startup with `MONGO_URL=mongodb://localhost:3001/meteor`.',
	},
	{
		filePath: 'ee/apps/account-service/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'ee/apps/authorization-service/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'ee/apps/ddp-streamer/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'ee/apps/omnichannel-transcript/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'ee/apps/presence-service/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'ee/apps/queue-worker/package.json',
		kind: 'explicit-default',
		details: 'MS script defaults to `mongodb://localhost:3001/meteor` if `MONGO_URL` is not set.',
	},
	{
		filePath: 'docker-compose-local.yml',
		kind: 'pass-through',
		details: 'Requires caller to provide `MONGO_URL` and optional `MONGO_OPLOG_URL`.',
	},
	{
		filePath: 'apps/meteor/tests/e2e/config/constants.ts',
		kind: 'explicit-default',
		details: 'E2E defaults `URL_MONGODB` from `MONGO_URL` or `mongodb://localhost:3001/meteor?retryWrites=false`.',
	},
	{
		filePath: 'ee/packages/federation-matrix/src/setup.ts',
		kind: 'explicit-default',
		details: 'Fallback URI uses `mongodb://localhost:3001/meteor` when `MONGO_URL` is absent.',
	},
];
