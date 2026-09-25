/**
 * The address as a location, or nothing.
 *
 * Parsed with no base, which turns away a relative address — it would resolve against this origin — as well as
 * a `javascript:` or `data:` one, which is not a location but something to run in a window we opened.
 *
 * Shared by the two ways a call address reaches us, the in-product window and the legacy `?callUrl=` page:
 * two copies of this are two answers waiting to disagree about what a provider may hand over.
 */
export const asCallUrl = (candidate: string): URL | undefined => {
	try {
		const url = new URL(candidate);

		return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined;
	} catch {
		return undefined;
	}
};
