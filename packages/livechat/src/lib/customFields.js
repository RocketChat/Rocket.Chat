import { Livechat } from '../api';
import store from '../store';

class CustomFields {
	constructor() {
		if (!CustomFields.instance) {
			this._initiated = false;
			this._started = false;
			this._queue = {};
			CustomFields.instance = this;
		}

		return CustomFields.instance;
	}

	init() {
		if (this._initiated) {
			return;
		}

		this._initiated = true;
		const { token } = store.state;
		Livechat.credentials.token = token;

		store.on('change', this.handleStoreChange);
	}

	reset() {
		this._initiated = false;
		this._started = false;
		this._queue = {};
		store.off('change', this.handleStoreChange);
	}

	handleStoreChange([state]) {
		const { user } = state;
		const { _started } = CustomFields.instance;

		if (_started) {
			return;
		}

		if (!user) {
			return;
		}

		CustomFields.instance._started = true;
		CustomFields.instance.processCustomFields();
	}

	processCustomFields() {
		Object.keys(this._queue).forEach((key) => {
			const { value, overwrite } = this._queue[key];
			this.setCustomField(key, value, overwrite);
		});

		this._queue = {};
	}

	setCustomField(key, value, overwrite = true) {
		if (!this._started) {
			this._queue[key] = { value, overwrite };
			return;
		}

		const { token } = Livechat.credentials;
		Livechat.sendCustomField({ token, key, value, overwrite });
	}
}

const instance = new CustomFields();
export default instance;
