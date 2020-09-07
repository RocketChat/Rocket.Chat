module.exports = {
	apps: [{
		name: 'Authorization',
		script: 'ts-node Authorization/service.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}, {
		name: 'Presence',
		script: 'ts-node Presence/service.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}, {
		name: 'Account',
		script: 'ts-node Account/service.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}, {
		name: 'StreamHub',
		script: 'ts-node StreamHub/service.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}, {
		name: 'DDPStreamer',
		script: 'ts-node DDPStreamer/service.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}],
};
