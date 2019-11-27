import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import Clipboard from 'clipboard';
import toastr from 'toastr';

import { APIClient } from '../../../utils/client';
import { modal } from '../../../ui-utils/client';

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
		instance.state.set('loading', true);

		APIClient
			.post('v1/cloud.manualRegister', {}, { cloudBlob: instance.state.get('cloudKey') })
			.then(() => modal.open({
				type: 'success',
				title: TAPi18n.__('Success'),
				text: TAPi18n.__('Cloud_register_success'),
				confirmButtonText: TAPi18n.__('Ok'),
				closeOnConfirm: false,
				showCancelButton: false,
			}, () => window.location.reload()))
			.catch(() => modal.open({
				type: 'error',
				title: TAPi18n.__('Error'),
				text: TAPi18n.__('Cloud_register_error'),
			}))
			.then(() => instance.state.set('loading', false));
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
	isLoading() {
		return Template.instance().state.get('loading');
	},
	step() {
		return Template.instance().state.get('step');
	},
	disabled() {
		const { state } = Template.instance();

		const shouldDisable = state.get('cloudKey').trim().length === 0 || state.get('loading');

		return shouldDisable && 'disabled';
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
		loading: false,
		clientKey: '',
		cloudKey: '',
		error: '',
	});

	Meteor.call('cloud:getWorkspaceRegisterData', (error, result) => {
		this.state.set('clientKey', result);
	});
});
