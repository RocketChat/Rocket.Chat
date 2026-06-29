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
		metricsReportFrequencyInMs: values.metricsReportFrequencyInMs !== undefined ? Number(values.metricsReportFrequencyInMs) : undefined,
	};
}
