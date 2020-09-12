import { ReadPreference, Db } from 'mongodb';

export function readSecondaryPreferred(db: Db, tags: any[] = []): ReadPreference {
	const { readPreferenceTags, readPreference } = db.options as any;

	if (tags.length === 0 && Array.isArray(readPreferenceTags) && readPreferenceTags.length) {
		tags = readPreferenceTags;
	} else if (tags.length === 0 && readPreference instanceof ReadPreference) {
		tags = readPreference.tags;
	}

	return new ReadPreference(ReadPreference.SECONDARY_PREFERRED, tags);
}
