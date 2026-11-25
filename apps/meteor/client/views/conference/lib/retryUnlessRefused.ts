import { isRefusal } from '../../../lib/utils/isRefusal';

/**
 * How often a conference read is tried: a refusal is an answer about the conference and is not asked again; a
 * request that never arrived gets two more tries.
 */
export const retryUnlessRefused = (failureCount: number, error: unknown): boolean => !isRefusal(error) && failureCount < 2;
