/* eslint new-cap:0 */

import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Spacebars } from 'meteor/spacebars';
import { Tracker } from 'meteor/tracker';

Blaze.toHTMLWithDataNonReactive = function(content, data) {
	const makeCursorReactive = function(obj) {
		if (obj instanceof Meteor.Collection.Cursor) {
			return obj._depend({
				added: true,
				removed: true,
				changed: true
			});
		}
	};

	makeCursorReactive(data);

	if (data instanceof Spacebars.kw && Object.keys(data.hash).length > 0) {
		Object.keys(data.hash).forEach(key => {
			makeCursorReactive(data.hash[key]);
		});

		data = data.hash;
	}

	return Tracker.nonreactive(() => Blaze.toHTMLWithData(content, data));
};

Blaze.registerHelper('nrrargs', function() {
	return {
		_arguments: arguments
	};
});

Blaze.renderNonReactive = function(templateName, data) {
	const { _arguments } = this.parentView.dataVar.get();

	[templateName, data] = _arguments;

	return Tracker.nonreactive(() => {
		const view = new Blaze.View('nrr', () => {
			return HTML.Raw(Blaze.toHTMLWithDataNonReactive(Template[templateName], data));
		});

		view.onViewReady(() => {
			const { onViewReady } = Template[templateName];
			return onViewReady && onViewReady.call(view, data);
		});

		view._onViewRendered(() => {
			const { onViewRendered } = Template[templateName];
			return onViewRendered && onViewRendered.call(view, data);
		});

		return view;
	});
};

Blaze.registerHelper('nrr', Blaze.Template('nrr', Blaze.renderNonReactive));
