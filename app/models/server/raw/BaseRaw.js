export class BaseRaw {
	constructor(col) {
		this.col = col;
	}

	findOne(...args) {
		return this.col.findOne(...args);
	}

	findUsersInRoles() {
		throw new Error('overwrite-function', 'You must overwrite this function in the extended classes');
	}
}
