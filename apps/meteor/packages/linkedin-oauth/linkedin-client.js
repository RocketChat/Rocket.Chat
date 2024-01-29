export const Linkedin = {};

// Request LinkedIn credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Linkedin.requestCredential = async function (options, credentialRequestCompleteCallback) {
	// This function will be replaced by meteorOverrides/login/linkedin.ts
	throw new Error('Linkedin integration error - invalid reference to original requestCredential implementation.');
};
