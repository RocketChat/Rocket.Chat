import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { getSchedulePresets } from './schedulePresets';

const getSchedulePresetsIn = (timeZone: string, now: string): Record<'tomorrow' | 'nextMonday', string> => {
	const script = `${readFileSync(require.resolve('./schedulePresets'), 'utf8')}
		const { tomorrow, nextMonday } = getSchedulePresets(new Date(${JSON.stringify(now)}));
		console.log(JSON.stringify({ tomorrow: tomorrow.toISOString(), nextMonday: nextMonday.toISOString() }));
	`;
	const output = execFileSync(process.execPath, ['--no-warnings', '--input-type=module-typescript', '--eval', script], {
		env: { ...process.env, TZ: timeZone },
		encoding: 'utf8',
	});
	return JSON.parse(output);
};

describe('getSchedulePresets', () => {
	it('offers 9:00 tomorrow and 9:00 next Monday in local time', () => {
		const { tomorrow, nextMonday } = getSchedulePresets(new Date(2026, 9, 21, 15, 30));

		expect(tomorrow).toEqual(new Date(2026, 9, 22, 9, 0));
		expect(nextMonday).toEqual(new Date(2026, 9, 26, 9, 0));
	});

	it('offers the Monday of next week when today is Monday', () => {
		expect(getSchedulePresets(new Date(2026, 9, 26, 8, 0)).nextMonday).toEqual(new Date(2026, 10, 2, 9, 0));
	});

	it('counts days from the local date when it differs from the UTC date', () => {
		expect(getSchedulePresetsIn('America/Sao_Paulo', '2026-10-26T01:00:00.000Z')).toEqual({
			tomorrow: '2026-10-26T12:00:00.000Z',
			nextMonday: '2026-10-26T12:00:00.000Z',
		});
	});
});
