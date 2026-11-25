import { isRefusal } from '../../../lib/utils/isRefusal';

/**
 * How often a conference read is tried. A refusal is an answer about the conference and is not asked again; a
 * request that never arrived gets two more tries, since a call window is opened once.
 */
export const retryUnlessRefused = (failureCount: number, error: unknown): boolean => !isRefusal(error) && failureCount < 2;
