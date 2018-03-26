// The idea of this page is to allow them to select a file from their system
// or enter a url or visit this page with a url attached which then their server
// downloads the file from the url. After it's either uploaded or downloaded,
// then the server parses it and takes them to that App's setting page
// to then allow them to enable it and go from there. A brand new App
// will NOT be enabled by default, they will have to manually enable it. However,
// if you're developing it and using a rest api with a particular parameter passed
// then it will be enabled by default for development reasons. The server prefers a url
// over the passed in body, so if both are found it will only use the url.

Template.appInstall.helpers({
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
		return !(instance.appUrl.get() || instance.file.get());
	}
});

Template.appInstall.onCreated(function() {
	const instance = this;
	instance.file = new ReactiveVar('');
	instance.isInstalling = new ReactiveVar(false);
	instance.appUrl = new ReactiveVar('');

	// Allow passing in a url as a query param to show installation of
	if (FlowRouter.getQueryParam('url')) {
		instance.appUrl.set(FlowRouter.getQueryParam('url'));
		FlowRouter.setQueryParams({ url: null });
	}
});

Template.appInstall.events({
	'change #upload-app'(e, i) {
		const file = e.currentTarget.files[0];
		i.file.set(file.name);
	},
	'click .js-cancel'(e, t) {
		FlowRouter.go('/admin/apps');
	},
	async 'click .js-install'(e, t) {
		const url = $('#appPackage').val().trim();

		// Handle url installations
		if (url) {
			try {
				t.isInstalling.set(true);
				const result = await RocketChat.API.post('apps', { url });
				FlowRouter.go(`/admin/apps/${ result.app.id }`);
			} catch (err) {
				console.warn('err', err);
			} finally {
				t.isInstalling.set(false);
			}
			return;
		}

		const files = $('#upload-app')[0].files;
		if (!(files instanceof FileList)) {
			return;
		}

		const data = new FormData();
		for (let i = 0; i < files.length; i++) {
			const f = files[0];

			if (f.type === 'application/zip') {
				data.append('app', f, f.name);
			}
		}

		if (!data.has('app')) {
			return;
		}

		t.isInstalling.set(true);
		try {
			const result = await RocketChat.API.upload('apps', data);
			FlowRouter.go(`/admin/apps/${ result.app.id }`);
		} catch (err) {
			console.warn('err', err);
		} finally {
			t.isInstalling.set(false);
		}
	}
});
