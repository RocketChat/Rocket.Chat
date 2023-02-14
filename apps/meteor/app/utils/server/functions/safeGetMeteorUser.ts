import { Meteor } from 'meteor/meteor';

const invalidEnvironmentErrorMessage = 'Meteor.userId can only be invoked in method calls or publications.';

/**
 * Helper that executes the `Meteor.user()`, but
 * supresses errors thrown if the code isn't
 * executed inside Meteor's environment
 *
 * Use this function only if it the code path is
 * expected to run out of Meteor's environment and
 * is prepared to handle those cases. Otherwise, it
 * is advisable to call `Meteor.user()` directly
 *
 * @returns The current user in the Meteor session, or null if not available
 */
export function safeGetMeteorUser(): Meteor.User | null {
	try {
		return Meteor.user();
	} catch (error: any) {
		// This is the only type of error we want to capture and supress,
		// so if the error thrown is different from what we expect, we let it go
		if (error?.message !== invalidEnvironmentErrorMessage) {
			throw error;
		}

		return null;
	}
}
