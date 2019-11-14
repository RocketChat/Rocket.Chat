// The idea of this page is to allow them to select a file from their system
// or enter a url or visit this page with a url attached which then their server
// downloads the file from the url. After it's either uploaded or downloaded,
// then the server parses it and takes them to that App's setting page
// to then allow them to enable it and go from there. A brand new App
// will NOT be enabled by default, they will have to manually enable it. However,
// if you're developing it and using a rest api with a particular parameter passed
// then it will be enabled by default for development reasons. The server prefers a url
// over the passed in body, so if both are found it will only use the url.
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { APIClient } from '../../../utils';
import { SideNav, modal } from '../../../ui-utils/client';

function handleInstallError(apiError) {
	if (!apiError.xhr || !apiError.xhr.responseJSON) { return; }

	const { status, messages, error } = apiError.xhr.responseJSON;

	let message;

	switch (status) {
		case 'storage_error':
			message = messages.join('');
			break;

		case 'compiler_error':
			message = 'There has been compiler errors. App cannot be installed';
			break;

		default:
			if (error) {
				message = error;
			} else {
				message = 'There has been an error installing the app';
			}
	}

	toastr.error(message);
	return message;
}

Template.appInstall.helpers({
	over() {
		const instance = Template.instance();
		return (instance.file.get() || instance.state.get('dragLevel') > 0) && 'over';
	},
	errorClass() {
		return Template.instance().state.get('error') && 'error';
	},
	error() {
		return Template.instance().state.get('error');
	},
	appFile() {
		return Template.instance().file.get();
	},
	isLoading() {
		return Template.instance().state.get('loading');
	},
	appUrl() {
		return Template.instance().appUrl.get();
	},
	loadingClass() {
		return Template.instance().state.get('loading') && 'loading';
	},
	disabled() {
		const instance = Template.instance();
		return instance.state.get('error') || !(instance.appUrl.get() || instance.file.get());
	},
	hideButtonText() {
		return Template.instance().state.get('loading') && 'visibility: hidden';
	},
	isUpdating() {
		const instance = Template.instance();

		return !!instance.isUpdatingId.get();
	},
});

Template.appInstall.onCreated(function() {
	const instance = this;
	this.state = new ReactiveDict({
		dragLevel: 0,
		error: false,
		loading: false,
	});
	instance.file = new ReactiveVar('');
	instance.appUrl = new ReactiveVar('');
	instance.isUpdatingId = new ReactiveVar('');

	// Allow passing in a url as a query param to show installation of
	if (FlowRouter.getQueryParam('url')) {
		instance.appUrl.set(FlowRouter.getQueryParam('url'));
		FlowRouter.setQueryParams({ url: null });
	}

	if (FlowRouter.getQueryParam('isUpdatingId')) {
		instance.isUpdatingId.set(FlowRouter.getQueryParam('isUpdatingId'));
	}
});

Template.appInstall.events({
	'dragenter .rc-dropfile'(e, i) {
		const level = i.state.get('dragLevel');
		i.state.set('dragLevel', level + 1);
		const types = e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types;
		if (types != null && types.length > 0 && types.every((type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1)) {
			i.state.set('over', true);
		}
		e.stopPropagation();
	},

	'dragleave .rc-dropfile'(e, i) {
		const level = i.state.get('dragLevel');
		i.state.set('dragLevel', level - 1);
		e.stopPropagation();
	},

	'dragover .rc-dropfile'(e) {
		e = e.originalEvent || e;
		if (['move', 'linkMove'].includes(e.dataTransfer.effectAllowed)) {
			e.dataTransfer.dropEffect = 'move';
		} else {
			e.dataTransfer.dropEffect = 'copy';
		}
		e.stopPropagation();
	},

	'dropped .rc-dropfile'(event, i) {
		i.state.set('dragLevel', 0);
		const e = event.originalEvent || event;
		const accept = event.currentTarget.querySelector('input').getAttribute('accept').split(',');

		let files = [];

		if (e.dataTransfer) {
			files = e.dataTransfer.files;
		} else if (e.target) {
			files = e.target.files;
		}

		e.stopPropagation();

		const [file] = files;

		if (!file) {
			return;
		}

		const accepted = accept.map((s) => s.trim()).includes(file.type);
		i.state.set('error', !accepted && 'error-invalid-file-type');
		i.files = accepted && files;
		i.file.set(accepted && file.name);
	},
	'input #appPackage'(e, i) {
		i.appUrl.set(e.currentTarget.value);
	},
	'change #upload-app'(e, i) {
		const file = e.currentTarget.files[0];
		file && i.file.set(file.name);
		i.state.set('error', null);
		i.files = [file];
	},
	'click .js-install'(e, t) {
		e.preventDefault();
		e.stopPropagation();

		const url = $('#appPackage').val().trim();
		t.state.set('loading', true);

		// Handle url installations
		if (url) {
			const isUpdating = t.isUpdatingId.get();
			let result;

			if (isUpdating) {
				result = APIClient.post(`apps/${ t.isUpdatingId.get() }`, { url });
			} else {
				result = APIClient.post('apps', { url });
			}

			return result
				.then(({ app }) => {
					modal.close();
					FlowRouter.go(`/admin/apps/${ app.id }`);
				})
				.catch((err) => t.state.set('error', handleInstallError(err)))
				.then(() => t.state.set('loading', false));
		}

		const f = t.file.get();
		if (!f) {
			return;
		}

		const data = new FormData();
		for (let i = 0; i < t.files.length; i++) {
			const f = t.files[i];
			if (f.type === 'application/zip') {
				data.append('app', f, f.name);
			}
		}

		if (!data.has('app')) {
			return;
		}

		const isUpdating = t.isUpdatingId.get();
		let result;

		if (isUpdating) {
			result = APIClient.upload(`apps/${ t.isUpdatingId.get() }`, data);
		} else {
			result = APIClient.upload('apps', data);
		}

		result
			.then(({ app }) => {
				modal.close();
				FlowRouter.go(`/admin/apps/${ app.id }?version=${ app.version }`);
			})
			.catch((err) => t.state.set('error', handleInstallError(err)))
			.then(() => t.state.set('loading', false));
	},
});

Template.appInstall.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
