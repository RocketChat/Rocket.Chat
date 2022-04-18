const watch = ['.', '../broker.ts', '../../../server/sdk'];

module.exports = {
	apps: [
		{
			name: 'authorization',
			watch: [...watch, '../../../server/services/authorization'],
		},
		{
			name: 'presence',
		},
		{
			name: 'account',
		},
		{
			name: 'stream-hub',
		},
		{
			name: 'ddp-streamer',
		},
	].map((app) =>
		Object.assign(app, {
			script: app.script || `ts-node --files ${app.name}/service.ts`,
			watch: app.watch || ['.', '../broker.ts', '../../../server/sdk', '../../../server/modules'],
			instances: 1,
			env: {
				MOLECULER_LOG_LEVEL: 'info',
				TRANSPORTER: 'nats://localhost:4222',
				MONGO_URL: 'mongodb://localhost:3001/meteor',
			},
		}),
	),
};
