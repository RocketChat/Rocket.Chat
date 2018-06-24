Meteor.startup(function() {
	RocketChat.messageBox.actions.add('Create_new', 'Google_doc', {
		id: 'google-doc',
		// icon to be added
		icon: 'google-doc',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'docs';
			const name = 'RocketChat Google Doc';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});

	RocketChat.messageBox.actions.add('Create_new', 'Google_slide', {
		id: 'google-slide',
		// icon to be added
		icon: 'google-slide',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'slides';
			const name = 'RocketChat Google Slide';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
						}
						Meteor.call('createGoogleFile', {type, name}, roomId);
					});
				} else {
					Meteor.call('createGoogleFile', {type, name}, roomId);
				}
			});
		}
	});

	RocketChat.messageBox.actions.add('Create_new', 'Google_sheet', {
		id: 'google-sheet',
		// icon to be added
		icon: 'google-sheet',
		condition() {
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return true;
		},
		action() {
			const roomId = Session.get('openedRoom');
			const type = 'sheets';
			const name = 'RocketChat Google Sheet';
			Meteor.call('checkDriveAccess', (error) => {
				if (error && error.error !== 'error-unauthenticated-user') {
					return toastr.error(t(error.error));
				} else if (error) {
					Meteor.loginWithGoogle({
						requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
					}, function(error) {
						if (error) {
							return;
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
