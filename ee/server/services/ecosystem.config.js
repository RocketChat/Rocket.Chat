const watch = ['.', '../broker.ts', '../../../server/sdk'];

module.exports = {
	apps: [{
		name: 'Authorization',
		watch: [...watch, '../../../server/services/authorization'],
	}, {
		name: 'Presence',
	}, {
		name: 'Account',
	}, {
		name: 'StreamHub',
	}, {
		name: 'DDPStreamer',
	}].map((app) => Object.assign(app, {
		script: app.script || `ts-node ${ app.name }/service.ts`,
		watch: app.watch || ['.', '../broker.ts', '../../../server/sdk'],
		instances: 1,
		env: {
			MOLECULER_LOG_LEVEL: 'info',
		},
	})),
};
