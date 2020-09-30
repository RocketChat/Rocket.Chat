/*
 * Errors described at:
 *	- https://tools.ietf.org/html/rfc3493
 */
const NETWORK_ERROR_CODES = [
	'EAI_AGAIN',
];

/*
 * Verifies if the given errcode is present in the list of possible network
 * errors.
 *
 * @param string errcode
 * @returns boolean
 */
export const isNetworkError = (errcode = '') => NETWORK_ERROR_CODES.includes(errcode);
