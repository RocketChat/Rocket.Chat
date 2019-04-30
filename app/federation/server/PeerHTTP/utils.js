import { Meteor } from 'meteor/meteor';

// Should skip the retry if the error is one of the below?
const errorsToSkipRetrying = ['error-app-prevented-sending', 'error-decrypt'];

export function skipRetryOnSpecificError(err) {
	err = err && err.response && err.response.data && err.response.data.errorType;
	return { skip: errorsToSkipRetrying.includes(err), error: err };
}

// Delay method to wait a little bit before retrying
export const delay = Meteor.wrapAsync(function(ms, callback) {
	Meteor.setTimeout(function() {
		callback(null);
	}, ms);
});
