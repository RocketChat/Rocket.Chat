import { Livechat } from '../api';
import store from '../store';

const docActivityEvents = ['mousemove', 'mousedown', 'touchend', 'keydown'];
let timer;
let initiated = false;
const awayTime = 300000;
let self;
let oldStatus;

const userPrensence = {

	init() {
		if (initiated) {
			return;
		}

		initiated = true;
		self = this;
		store.on('change', this.handleStoreChange);
	},

	reset() {
		initiated = false;
		this.stopEvents();
		store.off('change', this.handleStoreChange);
	},

	stopTimer() {
		timer && clearTimeout(timer);
	},

	startTimer() {
		this.stopTimer();
		timer = setTimeout(this.setAway, awayTime);
	},

	handleStoreChange([state]) {
		if (!initiated) {
			return;
		}

		const { room, user } = state;
		room && user ? self.startEvents() : self.stopEvents();
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
		self.startTimer();
		if (oldStatus === 'online') {
			return;
		}
		oldStatus = 'online';
		await Livechat.updateVisitorStatus('online');
	},

	async setAway() {
		self.stopTimer();
		if (oldStatus === 'away') {
			return;
		}
		oldStatus = 'away';
		await Livechat.updateVisitorStatus('away');
	},
};

export default userPrensence;
