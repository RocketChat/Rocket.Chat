import { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

export type AbacAttributeRow = { key: string; values: string[] };

/**
 * The attribute set a form currently describes, as attribute key → values.
 *
 * Every surface that edits room attributes — creating a channel, a room's own Edit channel panel
 * and the admin Rooms tab — needs this, and all three previously derived it themselves. They must
 * not disagree: this is what the membership-impact preview is asked about, what the PDP is asked to
 * authorise, and what is finally committed.
 *
 * `useWatch` rather than `watch()` is the load-bearing part. react-hook-form mutates the field
 * array in place, so the array `watch()` returns keeps its identity when a row's key or values
 * change; anything memoised on that identity never recomputes. That is what made the flows ask
 * about an attribute set the user could not see — an empty one while creating a room, and the
 * room's original attributes while editing one — which showed up as a preview that never loaded
 * and as authorisation refusals that did not match what was on screen (ABAC-P4 QA).
 *
 * Rows the user has not finished — no key chosen, or no values chosen — are left out, because a
 * half-filled row describes no restriction.
 */
export const useAbacAttributeMap = (control: Control<any>): Record<string, string[]> => {
	const attributes: AbacAttributeRow[] | undefined = useWatch({ control, name: 'attributes' });

	return useMemo(
		() =>
			Object.fromEntries(
				(attributes ?? []).filter(({ key, values }) => key && values?.length).map(({ key, values }) => [key, values]),
			) as Record<string, string[]>,
		[attributes],
	);
};
