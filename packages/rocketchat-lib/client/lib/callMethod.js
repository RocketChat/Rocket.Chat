/**
 * Wraps a Meteor method into a Promise.
 * This is particularly useful for creating information dialogs after execution of a Meteor method
 * @param {The Meteor method to be calls} method
 * @param {the method's parameters} params
 */
export const call = (method, ...params) => {
	return new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (err, result) => {
			if (err) {
				handleError(err);
				return reject(err);
			}
			return resolve(result);
		});
	});
};
