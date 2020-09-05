module.exports = {
	apps: [{
		name: 'Authorization',
		script: 'ts-node Authorization.ts',
		watch: true,
		instances: 2,
		// interpreter: '',
	}],
};
