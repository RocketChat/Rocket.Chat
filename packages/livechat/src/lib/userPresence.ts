import { Livechat } from '../api';
import type { StoreState } from '../store';
import store from '../store';

const docActivityEvents = ['mousemove' as const, 'mousedown' as const, 'touchend' as const, 'keydown' as const];
let timer: ReturnType<typeof setTimeout> | undefined;
let initiated = false;
const awayTime = 300000;
let oldStatus: string | undefined;

const userPrensence = {
	init() {
		if (initiated) {
			return;
		}

		initiated = true;
		store.on('change', this.handleStoreChange);
	},

	reset() {
		initiated = false;
		this.stopEvents();
		store.off('change', this.handleStoreChange);
	},

	stopTimer() {
		if (timer) {
			clearTimeout(timer);
		}
	},

	startTimer() {
		this.stopTimer();
		timer = setTimeout(this.setAway, awayTime);
	},

	handleStoreChange([state]: [StoreState]) {
		if (!initiated) {
			return;
		}

		const { room, user } = state;
		if (room && user) {
			userPrensence.startEvents();
		} else {
			userPrensence.stopEvents();
		}
	},

	startEvents() {
		docActivityEvents.forEach((event) => {
			document.addEventListener(event, this.setOnline);
		});

		window.addEventListener('focus', this.setOnline);
	},

	stopEvents() {
		docActivityEvents.forEach((event) => {
			document.removeEventListener(event, this.setOnline);
		});

		window.removeEventListener('focus', this.setOnline);
		this.stopTimer();
	},

	async setOnline() {
		userPrensence.startTimer();
		if (oldStatus === 'online') {
			return;
		}
		oldStatus = 'online';
		await Livechat.updateVisitorStatus('online');
	},

	async setAway() {
		userPrensence.stopTimer();
		if (oldStatus === 'away') {
			return;
		}
		oldStatus = 'away';
		await Livechat.updateVisitorStatus('away');
	},
};

export default userPrensence;
