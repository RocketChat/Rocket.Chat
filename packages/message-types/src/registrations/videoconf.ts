import type { MessageTypes } from '../MessageTypes.js';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'videoconf',
		system: false,
		text: (t) => t('Video_Conference'),
	});
};
