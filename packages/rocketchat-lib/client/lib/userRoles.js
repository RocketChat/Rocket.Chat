/* globals UserRoles */

Meteor.startup(function() {
	Meteor.call('getUserRoles', (error, results) => {
		if (error) {
			return toastr.error(TAPi18n.__(error.error));
		}

		for (let record of results) {
			UserRoles.upsert({ _id: record._id }, record);
		}
	});
});
