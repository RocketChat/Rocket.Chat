import { Livechat } from '../api';
import { loadConfig } from './main';

let initiated = false;

const Connection = {
	async init() {
		if (initiated) {
			return;
		}

		initiated = true;
		await this.connect();
	},

	async connect() {
		try {
			await import('../i18next');
			await loadConfig();
			await Livechat.connection.connect();
		} catch (e) {
			console.error('Connecting error: ', e);
		}
	},
};

export default Connection;
