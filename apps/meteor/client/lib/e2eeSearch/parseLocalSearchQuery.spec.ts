import type { IUser } from '@rocket.chat/core-typings';

import { parseLocalSearchQuery } from './parseLocalSearchQuery';
import { parseMessageSearchQuery } from '../../../server/lib/parseMessageSearchQuery';

const HOUR = 60 * 60 * 1000;
const utcMidnight = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day);

describe('parseLocalSearchQuery', () => {
	it('reads day-month-year dates, with the day boundaries at UTC midnight for a user with no utcOffset', () => {
		expect(parseLocalSearchQuery('needle after:26/10/2026 before:28-10-2026')).toEqual({
			text: 'needle',
			usernames: [],
			from: utcMidnight(2026, 10, 27),
			to: utcMidnight(2026, 10, 28),
		});
	});

	it('starts the day at midnight in the time zone of the user, like the server message search', () => {
		expect(parseLocalSearchQuery('on:26.10.2026', { utcOffset: -3 })).toEqual({
			text: '',
			usernames: [],
			from: utcMidnight(2026, 10, 26) + 3 * HOUR,
			to: utcMidnight(2026, 10, 27) + 3 * HOUR - 1,
		});
		expect(parseLocalSearchQuery('on:26.10.2026', { utcOffset: 5.5 })).toEqual({
			text: '',
			usernames: [],
			from: utcMidnight(2026, 10, 26) - 5.5 * HOUR,
			to: utcMidnight(2026, 10, 27) - 5.5 * HOUR - 1,
		});
	});

	it('does not read ISO dates, like the server message search: they stay in the text', () => {
		expect(parseLocalSearchQuery('from:me after:2026-10-26')).toEqual({ text: 'after:2026-10-26', usernames: ['me'] });
	});

	it('keeps the last before: and the last after:, and on: replaces both, like the server message search', () => {
		expect(parseLocalSearchQuery('before:10-03-2025 before:01-03-2025 after:01-01-2025 after:05-01-2025')).toMatchObject({
			from: utcMidnight(2025, 1, 6),
			to: utcMidnight(2025, 3, 1),
		});
		expect(parseLocalSearchQuery('before:10-03-2025 on:5.6.2024')).toMatchObject({
			from: utcMidnight(2024, 6, 5),
			to: utcMidnight(2024, 6, 6) - 1,
		});
	});
});

describe('parseLocalSearchQuery and the server message search', () => {
	// The server range does not depend on the time zone of the server process. These specs run in UTC (`TZ=UTC`).
	const serverRange = (text: string, utcOffset: number | undefined) => {
		const { query } = parseMessageSearchQuery(text, { user: { utcOffset } as IUser });
		const ts = query.ts as { $gte?: Date; $lte?: Date; $lt?: Date } | undefined;
		const to = ts?.$lte?.getTime() ?? (ts?.$lt ? ts.$lt.getTime() - 1 : undefined);
		return { from: ts?.$gte?.getTime(), to };
	};

	const localRange = (text: string, utcOffset: number | undefined) => {
		const { from, to } = parseLocalSearchQuery(text, { utcOffset });
		return { from, to };
	};

	const texts = [
		'needle after:26/10/2026',
		'before:28-10-2026',
		'on:5.6.2024',
		'on:31/12/2025',
		'on:31/02/2026',
		'after:01-01-2025 before:10/03/2025',
		'before:10-03-2025 before:01-03-2025',
		'after:01-03-2025 after:10-03-2025',
		'after:01-01-2025 on:5.6.2024 before:10-03-2025',
		'after:2026-10-26',
		'before:1/2/2025',
		'needle',
	];
	const utcOffsets = [undefined, 0, -3, 5.5, -9.5, 10, 14, -12];

	it.each(texts.flatMap((text) => utcOffsets.map((utcOffset) => [text, utcOffset] as const)))(
		'gives the same range for %j with utcOffset %p',
		(text, utcOffset) => {
			expect(localRange(text, utcOffset)).toEqual(serverRange(text, utcOffset));
		},
	);
});
