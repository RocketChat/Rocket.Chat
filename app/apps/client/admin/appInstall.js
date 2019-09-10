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
import { SideNav } from '../../../ui-utils/client';

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
}

Template.appInstall.helpers({
	over() {
		const instance = Template.instance();
		return (instance.appUrl.get() || instance.state.get('over')) && 'over';
	},
	error() {
		return Template.instance().state.get('error') && 'error';
	},
	appFile() {
		return Template.instance().file.get();
	},
	isInstalling() {
		return Template.instance().isInstalling.get();
	},
	appUrl() {
		return Template.instance().appUrl.get();
	},
	disabled() {
		const instance = Template.instance();
		return instance.state.get('error') || !(instance.appUrl.get() || instance.file.get());
	},
	isUpdating() {
		const instance = Template.instance();

		return !!instance.isUpdatingId.get();
	},
});

Template.appInstall.onCreated(function() {
	const instance = this;
	this.state = new ReactiveDict({
		error: false,
	});
	instance.file = new ReactiveVar('');
	instance.isInstalling = new ReactiveVar(false);
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
		const types = e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types;
		if (types != null && types.length > 0 && types.every((type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1)) {
			i.state.set('over', true);
		}
		e.stopPropagation();
	},

	'dragleave .rc-dropfile'(e, i) {
		i.state.set('over', false);
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
		i.state.set('over', false);
		const e = event.originalEvent || event;
		const accept = event.currentTarget.getAttribute('accept').split(',');

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
		i.state.set('error', !accepted);
		i.files = accepted && files;
		i.file.set(accepted && file.name);
	},
	'input #appPackage'(e, i) {
		i.appUrl.set(e.currentTarget.value);
	},
	'change #upload-app'(e, i) {
		const file = e.currentTarget.files[0];
		i.file.set(file.name);
	},
	'click .js-cancel'() {
		FlowRouter.go('/admin/apps');
	},
	async 'click .js-install'(e, t) {
		e.preventDefault();

		const url = $('#appPackage').val().trim();

		// Handle url installations
		if (url) {
			try {
				t.isInstalling.set(true);
				const isUpdating = t.isUpdatingId.get();
				let result;

				if (isUpdating) {
					result = await APIClient.post(`apps/${ t.isUpdatingId.get() }`, { url });
				} else {
					result = await APIClient.post('apps', { url });
				}

				FlowRouter.go(`/admin/apps/${ result.app.id }`);
			} catch (err) {
				handleInstallError(err);
			}

			t.isInstalling.set(false);

			return;
		}

		const f = t.file;
		if (!f) {
			return;
		}

		const data = new FormData();
		for (let i = 0; i < t.files.length; i++) {
			const f = t.files[0];

			if (f.type === 'application/zip') {
				data.append('app', f, f.name);
			}
		}

		if (!data.has('app')) {
			return;
		}

		t.isInstalling.set(true);
		try {
			const isUpdating = t.isUpdatingId.get();
			let result;

			if (isUpdating) {
				result = await APIClient.upload(`apps/${ t.isUpdatingId.get() }`, data);
			} else {
				result = await APIClient.upload('apps', data);
			}

			FlowRouter.go(`/admin/apps/${ result.app.id }?version=${ result.app.version }`);
		} catch (err) {
			handleInstallError(err);
		}

		t.isInstalling.set(false);
	},
});

Template.appInstall.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
