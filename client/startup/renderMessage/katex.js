import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks';
import { settings } from '../../../app/settings';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('Katex_Enabled');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'katex');
			return;
		}

		const options = {
			dollarSyntax: settings.get('Katex_Dollar_Syntax'),
			parenthesisSyntax: settings.get('Katex_Parenthesis_Syntax'),
		};

		import('../../../app/katex/client').then(({ createKatexMessageRendering }) => {
			const renderMessage = createKatexMessageRendering(options);
			callbacks.remove('renderMessage', 'katex');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH + 1, 'katex');
		});
	});
});
