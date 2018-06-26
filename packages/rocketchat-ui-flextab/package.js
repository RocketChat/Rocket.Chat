Package.describe({
	name: 'rocketchat:ui-flextab',
	version: '0.1.0',
	// Brief, one-line summary of the package.
	summary: '',
	// URL to the Git repository containing the source code for this package.
	git: '',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'templating',
		'rocketchat:lib'
	]);

	api.addFiles('client/flexTabBar.html', 'client');
	api.addFiles('client/tabs/inviteUsers.html', 'client');
	api.addFiles('client/tabs/membersList.html', 'client');
	api.addFiles('client/tabs/uploadedFilesList.html', 'client');
	api.addFiles('client/tabs/userEdit.html', 'client');
	api.addFiles('client/tabs/userInfo.html', 'client');

	api.addFiles('client/flexTabBar.js', 'client');
	api.addFiles('client/tabs/inviteUsers.js', 'client');
	api.addFiles('client/tabs/membersList.js', 'client');
	api.addFiles('client/tabs/uploadedFilesList.js', 'client');
	api.addFiles('client/tabs/userEdit.js', 'client');
	api.addFiles('client/tabs/userInfo.js', 'client');
	api.addFiles('client/tabs/keyboardShortcuts.html', 'client');
	api.addFiles('client/tabs/getFileFromIPFS.html', 'client');
	api.addFiles('client/tabs/getFileFromIPFS.js', 'client');
});


// IPFS


// ipfs mkdir /test2
// ipfs files write --create  /test2/img cropped-brave_icon_512x.jpeg
// ipfs file stat /test2
// ipfs ls <HASH of Dir>
// ipfs files rm /test2


// API  (ipfs files api) https://ipfs.io/docs/api/

// curl "http://localhost:5001/api/v0/cat?arg=QmShLqDHLZ4NECqaiez6dW1Yhc4WDDNpi7QTH8XRFvuayf"

