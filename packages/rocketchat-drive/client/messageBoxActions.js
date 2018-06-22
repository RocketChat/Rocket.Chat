Meteor.startup(function() {
	RocketChat.messageBox.actions.add('Create_new', 'Google_doc', {
		id: 'google-doc',
		// icon to be added
		icon: 'google-doc',
		condition() {
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'docs';
			const name = 'RocketChat Google Doc'; // placeholder for now, TODO: ask from user
			Meteor.call('checkDriveAccess', (error) => {
				if (error && (error.error === 'error-invalid-user' || error.error === 'error-google-unavailable')) {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							console.log(error);
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});
});
