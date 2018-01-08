class CustomUserStatus extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('custom_user_status');
	}
}

RocketChat.models.CustomUserStatus = new CustomUserStatus();
