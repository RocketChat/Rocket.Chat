import * as util from 'util';

import { Apps } from './orchestrator';

// We could wrap this one in an internal API that makes it easier to register "info dumpers"
// that respond to this signal
process.on('SIGUSR2', () => {
	console.log('Signal SIGUSR2 received - Rocket.Chat debug dump will start');
});

process.on('SIGUSR2', () => {
	console.log('APPS - Runtime Subprocesses memory consumption');

	const systemRecords = Apps.getManager()
		?.getRuntimeSystemRecords()
		.map((s) => ({
			appId: s.appId,
			system: {
				rss: s.system.rss / 1024 / 1024,
				heapTotal: s.system.heapTotal / 1024 / 1024,
				heapUsed: s.system.heapUsed / 1024 / 1024,
				external: s.system.external / 1024 / 1024,
			},
		}));

	console.log(
		util.inspect(
			{
				totals: systemRecords?.reduce(
					(sum, value) => {
						sum.rss += value.system.rss;
						sum.heapTotal += value.system.heapTotal;
						sum.heapUsed += value.system.heapUsed;
						sum.external += value.system.external;

						return sum;
					},
					{
						rss: 0,
						heapTotal: 0,
						heapUsed: 0,
						external: 0,
					},
				),
				systemRecords,
			},
			false,
			5,
		),
	);
});
