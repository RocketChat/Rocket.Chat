/* eslint-disable no-undef */
/* exports _dbs */

/**
 * Global helper for DB-specific functions
 */
_dbs = {
	unique: function(arrayArgument) {
		return arrayArgument.filter((elem, pos, arr) => {
			return arr.indexOf(elem) === pos;
		});
	}
};
