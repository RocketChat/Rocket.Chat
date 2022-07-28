import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './collapseArrow.html';

export const createCollapseable = (template, getInicialFromInstance = () => false) => {
	template.onCreated(function () {
		this.collapsedMedia = new ReactiveVar(getInicialFromInstance(Template.instance()));
	});
	template.helpers({
		collapsed() {
			return Template.instance().collapsedMedia.get();
		},
		collapsedMediaVar() {
			return Template.instance().collapsedMedia;
		},
	});
};

Template.collapseArrow.events({
	'click .collapse-switch'(e, i) {
		e.preventDefault();
		i.data.collapsedMedia.set(!i.data.collapsedMedia.get());
	},
});

Template.collapseArrow.helpers({
	collapsed() {
		return this.collapsedMedia.get();
	},
});
