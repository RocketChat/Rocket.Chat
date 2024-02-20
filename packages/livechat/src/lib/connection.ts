import i18next from 'i18next';

import { Livechat } from '../api';
import type { Alert } from '../definitions/alert';
import store from '../store';
import constants from './constants';
import { loadConfig } from './main';
import { loadMessages } from './room';

let connectedListener: Promise<() => void> | false;
let disconnectedListener: Promise<() => void> | false;
let initiated = false;
const { livechatDisconnectedAlertId, livechatConnectedAlertId } = constants;
const removeListener = (l: any) => l.stop();

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
			// await Livechat.connection.connect();
			this.addListeners();
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

		const filteredAlerts = alerts.filter(
			(alert) =>
				![livechatDisconnectedAlertId, livechatConnectedAlertId].includes(alert.id as 'LIVECHAT_CONNECTED' | 'LIVECHAT_DISCONNECTED'),
		);
		await store.setState({
			alerts: filteredAlerts,
		});
	},

	async displayAlert(alert: Alert) {
		if (!alert?.id) {
			throw new Error('alert.id is required');
		}
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
			connectedListener = Promise.resolve(Livechat.connection.on('connected', this.handleConnected));
		}

		if (!disconnectedListener) {
			disconnectedListener = Promise.resolve(Livechat.connection.on('disconnected', this.handleDisconnected));
		}
	},

	clearListeners() {
		if (connectedListener) {
			connectedListener.then(removeListener);
			connectedListener = false;
		}

		if (disconnectedListener) {
			disconnectedListener.then(removeListener);
			disconnectedListener = false;
		}
	},
};

export default Connection;
