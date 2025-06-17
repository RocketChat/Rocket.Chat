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
		Livechat.token = token;

		store.on('change', this.handleStoreChange);
	}

	reset() {
		this._initiated = false;
		this._started = false;
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

	addToQueue(key, value, overwrite) {
		const { customFieldsQueue } = store.state;
		store.setState({
			customFieldsQueue: {
				...customFieldsQueue,
				[key]: { value, overwrite },
			},
		});
	}

	getQueue() {
		return store.state.customFieldsQueue;
	}

	clearQueue() {
		store.setState({ customFieldsQueue: {} });
	}

	processCustomFields() {
		const queue = this.getQueue();
		Object.entries(queue).forEach(([key, { value, overwrite }]) => {
			this.setCustomField(key, value, overwrite);
		});

		this.clearQueue();
	}

	setCustomField(key, value, overwrite = true) {
		if (!this._started) {
			this.addToQueue(key, value, overwrite);
			return;
		}

		const { token } = Livechat;
		Livechat.sendCustomField({ token, key, value, overwrite });
	}
}

const instance = new CustomFields();
export default instance;
