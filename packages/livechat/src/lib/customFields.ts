import { Livechat } from '../api';
import type { StoreState } from '../store';
import store from '../store';

class CustomFields {
	static instance: CustomFields;

	private _initiated = false;

	private _started = false;

	constructor() {
		if (!CustomFields.instance) {
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

	handleStoreChange([state]: [StoreState]) {
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

	addToQueue(key: string, value: string, overwrite: boolean) {
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

	setCustomField(key: string, value: string, overwrite = true) {
		if (!this._started) {
			this.addToQueue(key, value, overwrite);
			return;
		}

		const { token } = Livechat;
		if (token) {
			void Livechat.sendCustomField({ token, key, value, overwrite });
		}
	}
}

const instance = new CustomFields();
export default instance;
