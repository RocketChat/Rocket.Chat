import { ReadPreference, Db } from 'mongodb';

export function readSecondaryPreferred(db: Db, tags: any[] = []): ReadPreference | string {
	const { readPreferenceTags, readPreference } = db.options as any;

	if (tags.length === 0) {
		if (Array.isArray(readPreferenceTags) && readPreferenceTags.length) {
			tags = readPreferenceTags;
		} else if (readPreference instanceof ReadPreference) {
			tags = readPreference.tags;
		}
	}

	// For some reason the new ReadPreference definition requires the tags parameter even not been
	// required by the code implementation and, for some reason, when passing an empty array it
	// doesn't ignore the tags and stop using the secondaries.
	if (!tags.length) {
		return ReadPreference.SECONDARY_PREFERRED;
	}

	return new ReadPreference(ReadPreference.SECONDARY_PREFERRED, tags);
}
