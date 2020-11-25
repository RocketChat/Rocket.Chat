import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';

import './style.css';

const createHexColorPreviewMessageRenderer = () =>
	(message) => {
		if (!message.html?.trim()) {
			return message;
		}

		const regex = /(?:^|\s|\n)(#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?)\b/g;

		message.html = message.html.replace(regex, (match, completeColor) => match.replace(completeColor, `<div class="message-color"><div class="message-color-sample" style="background-color:${ completeColor }"></div>${ completeColor.toUpperCase() }</div>`));
		return message;
	};

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('HexColorPreview_Enabled') === true;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'hexcolor');
			return;
		}

		const renderMessage = createHexColorPreviewMessageRenderer();

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'hexcolor');
	});
});
