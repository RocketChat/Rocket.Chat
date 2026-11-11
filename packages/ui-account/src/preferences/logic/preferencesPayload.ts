import type { AccountPreferencesData } from './usePreferences';

export type DontAskAgainItem = { action: string; label: string };

export const parseHighlights = (highlights: string): string[] =>
	highlights
		.split(/,|\n/)
		.map((value) => value.trim())
		.filter(Boolean);

/** Turns the edited form fields into the `users.setPreferences` payload. */
export const toPreferencesPayload = (changes: Partial<AccountPreferencesData>, dontAskAgainItems: readonly DontAskAgainItem[]) => {
	const { highlights, dontAskAgainList, ...data } = changes;

	return {
		...data,
		...(highlights !== undefined && { highlights: parseHighlights(highlights) }),
		...(dontAskAgainList !== undefined && {
			dontAskAgainList: dontAskAgainItems.filter(({ action }) => dontAskAgainList.includes(action)),
		}),
	};
};
