
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import Clipboard from 'clipboard';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import './cloudRegisterManually.html';
import './cloudRegisterManually.css';

const CLOUD_STEPS = {
	COPY: 0,
	PASTE: 1,
	DONE: 2,
	ERROR: 3,
};

Template.cloudRegisterManually.events({
	'submit form'(e) {
		e.preventDefault();
	},
	'input .js-cloud-key'(e, instance) {
		instance.state.set('cloudKey', e.currentTarget.value);
	},
	'click .js-next'(event, instance) {
		instance.state.set('step', CLOUD_STEPS.PASTE);
	},
	'click .js-back'(event, instance) {
		instance.state.set('step', CLOUD_STEPS.COPY);
	},
	'click .js-finish'(event, instance) {
		instance.state.set('step', CLOUD_STEPS.DONE);
	},
});

Template.cloudRegisterManually.helpers({
	cloudLink() {
		return Template.instance().cloudLink.get();
	},
	copyStep() {
		return Template.instance().state.get('step') === CLOUD_STEPS.COPY;
	},
	clientKey() {
		return Template.instance().state.get('clientKey');
	},
	step() {
		return Template.instance().state.get('step');
	},
	disabled() {
		return Template.instance().state.get('cloudKey').trim().length === 0 && 'disabled';
	},
});

Template.cloudRegisterManually.onRendered(function() {
	const clipboard	= new Clipboard('.js-copy');
	clipboard.on('success', function() {
		toastr.success(TAPi18n.__('Copied'));
	});

	const btn = this.find('.cloud-console-btn');
	// After_copy_the_text_go_to_cloud
	this.cloudLink.set(TAPi18n.__('Cloud_click_here').replace(/(\[(.*)\]\(\))/ig, (_, __, text) => btn.outerHTML.replace('</a>', `${ text }</a>`)));
});

Template.cloudRegisterManually.onCreated(function() {
	this.cloudLink = new ReactiveVar();
	this.state = new ReactiveDict({
		step: CLOUD_STEPS.COPY,
		clientKey: 'hdaur11cq90c908ud89fa8hya89w89h89a8hq89h8x9h8chdaur11cq90c908ud89fa8hya89hw89h89a8hq89h8x9h8chdaur11cq90c908ud89fa8hya89hw89h89a8hq89h8x9h8chdaur11cq90c908ud89fa8hya89hw89h89a8hq89h8x9h8chdaur11cq90c908ud89fa8hya89 hw89h89a8hq89h8x9h8c',
		cloudKey: '',
		error: '',
	});
});
