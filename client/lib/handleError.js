this.handleError = function(error, useToastr = true) {
	if (_.isObject(error.details)) {
		for (var key in error.details) {
			if (error.details.hasOwnProperty(key)) {
				error.details[key] = TAPi18n.__(error.details[key]);
			}
		}
	}

	if (useToastr) {
		return toastr.error(TAPi18n.__(error.error, error.details));
	} else {
		return TAPi18n.__(error.error, error.details);
	}
};
