export const transformDatesForAPI = (start, end) => {
	if (isNaN(Date.parse(start))) {
		throw new Error('The "start" query parameter must be a valid date.');
	}
	if (end && isNaN(Date.parse(end))) {
		throw new Error('The "end" query parameter must be a valid date.');
	}
	start = new Date(start);
	end = new Date(end);
	return {
		start,
		end,
	};
};
