/* eslint new-cap:0 */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Spacebars } from 'meteor/spacebars';
import { Tracker } from 'meteor/tracker';

const makeCursorReactive = function (obj) {
	if (obj instanceof Meteor.Collection.Cursor) {
		return obj._depend({
			added: true,
			removed: true,
			changed: true,
		});
	}
};

const toHTMLWithDataNonReactive = function (content, data) {
	makeCursorReactive(data);

	if (data instanceof Spacebars.kw && Object.keys(data.hash).length > 0) {
		Object.entries(data.hash).forEach(([, value]) => makeCursorReactive(value));
		return Tracker.nonreactive(() => Blaze.toHTMLWithData(content, data.hash));
	}
	return Tracker.nonreactive(() => Blaze.toHTMLWithData(content, data));
};

const renderNonReactive = function (templateName, data) {
	const { _arguments } = this.parentView.dataVar.get();

	[templateName, data] = _arguments;

	return Tracker.nonreactive(() => {
		console.warn('Nrr template is deprecated');
		const view = new Blaze.View('nrr', () => HTML.Raw(toHTMLWithDataNonReactive(Template[templateName], data)));

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

Template.nrr = new Blaze.Template('nrr', renderNonReactive);
