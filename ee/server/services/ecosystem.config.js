module.exports = {
	apps: [{
		name: 'Authorization',
		script: 'ts-node Authorization/Authorization.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}, {
		name: 'Presence',
		script: 'ts-node Presence/Presence.ts',
		watch: true,
		instances: 1,
		// interpreter: '',
	}],
};
