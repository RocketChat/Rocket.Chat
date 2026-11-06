// Resume failures in which the server says the token can no longer log in: the token is unknown or expired, or the
// account itself may not log in. Any other failure (an internal error, a rate limit, a service still starting) says
// nothing about the token.
// The server answers every refused login with a 401 so it does not disclose whether the user exists.
const REFUSED_LOGIN_STATUS = 401;

const refusedReasonPrefixes = ["You've been logged out by the server", 'Your session has expired'];

const refusedErrorCodes = ['error-user-is-not-activated', 'error-user-has-no-roles', 'error-app-user-is-not-allowed-to-login'];

export const isLoginTokenRefused = (error: unknown): boolean => {
	if (!error || typeof error !== 'object') {
		return false;
	}

	const { error: code, reason } = error as { error?: unknown; reason?: unknown };

	if (code === REFUSED_LOGIN_STATUS) {
		return true;
	}

	if (typeof code === 'string' && refusedErrorCodes.includes(code)) {
		return true;
	}

	return [reason, code].some((value) => typeof value === 'string' && refusedReasonPrefixes.some((prefix) => value.startsWith(prefix)));
};
