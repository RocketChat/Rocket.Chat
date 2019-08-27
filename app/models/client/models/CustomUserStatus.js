import { Base } from './_Base';

class CustomUserStatus extends Base {
	constructor() {
		super();
		this._initModel('custom_user_status');
	}
}

export default new CustomUserStatus();
