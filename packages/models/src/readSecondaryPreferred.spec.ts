import type { Db } from 'mongodb';
import { ReadPreference } from 'mongodb';

import { readSecondaryPreferred } from './readSecondaryPreferred';

const dbReadingFrom = (readPreference: ReadPreference) => ({ options: { readPreference } }) as unknown as Db;

it('should keep the tags of the database read preference', () => {
	const tags = [{ region: 'west' }];

	expect(readSecondaryPreferred(dbReadingFrom(new ReadPreference('secondary', tags)))).toEqual(
		new ReadPreference(ReadPreference.SECONDARY_PREFERRED, tags),
	);
});

it('should read from any secondary when no tags are set', () => {
	expect(readSecondaryPreferred(dbReadingFrom(new ReadPreference('secondary')))).toBe(ReadPreference.SECONDARY_PREFERRED);
	expect(readSecondaryPreferred()).toBe(ReadPreference.SECONDARY_PREFERRED);
});
