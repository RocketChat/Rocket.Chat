// The idea of this page is to allow them to select a file from their system
// or enter a url or visit this page with a url attached which then their server
// downloads the file from the url. After it's either uploaded or downloaded,
// then the server parses it and takes them to that Rocketlet's setting page
// to then allow them to enable it and go from there. A brand new Rocketlet
// will NOT be enabled by default, they will have to manually enable it. However,
// if you're developing it and using a rest api with a particular parameter passed
// then it will be enabled by default for development reasons. The server prefers a url
// over the passed in body, so if both are found it will only use the url.

Template.rocketletInstall.helpers({
	rocketletUrl() {
		return Template.instance().rocketletUrl.get();
	}
});

Template.rocketletInstall.onCreated(function() {
	const instance = this;
	instance.status = new ReactiveVar(false);
	instance.rocketletUrl = new ReactiveVar('');

	// Allow passing in a url as a query param to show installation of
	if (FlowRouter.getQueryParam('url')) {
		console.log('Url:', FlowRouter.getQueryParam('url'));
		instance.rocketletUrl.set(FlowRouter.getQueryParam('url'));
		FlowRouter.setQueryParams({ url: null });
	}
});

Template.rocketletInstall.events({
	'click .install'() {
		const url = $('#rocketletPackage').val().trim();

		// Handle url installations
		if (url) {
			console.log('Installing via url.');
			RocketChat.API.post('rocketlets', { url }).then((result) => {
				console.log('result', result);
			}).catch((err) => {
				console.warn('err', err);
			});

			return;
		}

		const files = $('#upload-rocketlet')[0].files;
		console.log('to install:', files);
	}
});
