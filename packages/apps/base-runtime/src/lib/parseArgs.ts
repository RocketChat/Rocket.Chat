import { parseArgs as $parseArgs } from 'node:util';

export type ParsedArgs = {
	subprocess: string;
	spawnId: number;
	metricsReportFrequencyInMs?: number;
};

export function parseArgs(args: string[]): ParsedArgs {
	const { values } = $parseArgs({
		args,
		options: {
			subprocess: { type: 'string' },
			spawnId: { type: 'string' },
			metricsReportFrequencyInMs: { type: 'string' },
		},
		strict: false,
	});

	return {
		subprocess: (values.subprocess as string) ?? '',
		spawnId: Number(values.spawnId ?? 0),
		metricsReportFrequencyInMs:
			// isFinite is incorrectly typed in lib.es5.d.ts
			typeof values.metricsReportFrequencyInMs !== 'undefined' && isFinite(values.metricsReportFrequencyInMs as any)
				? Number(values.metricsReportFrequencyInMs)
				: undefined,
	};
}
