import { ReadPreference, Db, ReadPreferenceOrMode } from 'mongodb';

export function readSecondaryPreferred(db: Db, tags: any[] = []): ReadPreferenceOrMode {
	const { readPreferenceTags, readPreference } = db.options;

	if (tags.length) {
		return new ReadPreference(ReadPreference.SECONDARY_PREFERRED, tags);
	}
	if (Array.isArray(readPreferenceTags) && readPreferenceTags.length) {
		return new ReadPreference(ReadPreference.SECONDARY_PREFERRED, readPreferenceTags);
	}
	if (readPreference instanceof ReadPreference && readPreference.tags.length) {
		return new ReadPreference(ReadPreference.SECONDARY_PREFERRED, readPreference.tags);
	}

	// For some reason the new ReadPreference definition requires the tags parameter even not been
	// required by the code implementation and, for some reason, when passing an empty array it
	// doesn't ignore the tags and stop using the secondaries.
	return ReadPreference.SECONDARY_PREFERRED;
}
