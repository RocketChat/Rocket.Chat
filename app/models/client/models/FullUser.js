import { Base } from './_Base';

class FullUser extends Base {
	constructor() {
		super();
		this._initModel('full_user');
	}
}

export default new FullUser();
