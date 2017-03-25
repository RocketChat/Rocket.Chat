import toastr from 'toastr';
this.handleError = function(error, useToastr = true) {
	if (_.isObject(error.details)) {
		for (const key in error.details) {
			if (error.details.hasOwnProperty(key)) {
				error.details[key] = TAPi18n.__(error.details[key]);
			}
		}
	}

	if (useToastr) {
		return toastr.error(TAPi18n.__(error.error, error.details), error.details && error.details.errorTitle ? TAPi18n.__(error.details.errorTitle) : null);
	}

	return TAPi18n.__(error.error, error.details);
};
