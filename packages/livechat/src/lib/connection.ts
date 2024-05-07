import i18next from 'i18next';

import { Livechat } from '../api';
import store from '../store';
import constants from './constants';
import { loadConfig } from './main';
import { loadMessages } from './room';

let connectedListener: (() => void) | undefined;
let disconnectedListener: (() => void) | undefined;
let initiated = false;
const { livechatDisconnectedAlertId, livechatConnectedAlertId } = constants;

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
			this.clearListeners();
			await loadConfig();
			this.addListeners();
			await Livechat.connection.connect();
			this.clearAlerts();
		} catch (e) {
			console.error('Connecting error: ', e);
		}
	},

	// reconnect() {
	// 	if (timer) {
	// 		return;
	// 	}
	// 	timer = setTimeout(async () => {
	// 		try {
	// 			clearTimeout(timer);
	// 			timer = false;
	// 			await this.connect();
	// 			await loadMessages();
	// 		} catch (e) {
	// 			console.error('Reconecting error: ', e);
	// 			this.reconnect();
	// 		}
	// 	}, 5000);
	// },

	async clearAlerts() {
		const { alerts } = store.state;
		await store.setState({ alerts: alerts.filter((alert) => ![livechatDisconnectedAlertId, livechatConnectedAlertId].includes(alert.id)) });
	},

	async displayAlert(alert = {}) {
		const { alerts } = store.state;
		await store.setState({ alerts: (alerts.push(alert), alerts) });
	},

	async handleConnected() {
		await Connection.clearAlerts();
		await Connection.displayAlert({ id: livechatConnectedAlertId, children: i18next.t('livechat_connected'), success: true });
		await loadMessages();
	},

	async handleDisconnected() {
		await Connection.clearAlerts();
		await Connection.displayAlert({
			id: livechatDisconnectedAlertId,
			children: i18next.t('livechat_is_not_connected'),
			error: true,
			timeout: 0,
		});
		// self.reconnect();
	},

	addListeners() {
		if (!connectedListener) {
			connectedListener = Livechat.connection.on('connected', this.handleConnected);
		}

		if (!disconnectedListener) {
			disconnectedListener = Livechat.connection.on('disconnected', this.handleDisconnected);
		}
	},

	clearListeners() {
		connectedListener?.();
		connectedListener = undefined;

		disconnectedListener?.();
		disconnectedListener = undefined;
	},
};

export default Connection;
