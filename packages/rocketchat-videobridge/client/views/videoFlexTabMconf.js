/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
/* globals popout */

Template.videoFlexTabMconf.helpers({
	openInNewWindow() {
		if (Meteor.isCordova) {
			return true;
		} else {
			return RocketChat.settings.get('Jitsi_Open_New_Window');
		}
	},

	live() {
		return RocketChat.models.Rooms.findOne({ _id: Session.get('openedRoom'), 'streamingOptions.type': 'call' }, { fields: { streamingOptions: 1 } }) != null;
	}
});

Template.videoFlexTabMconf.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.videoFlexTabMconf.events({
	'click .js-join-meeting'(e) {
		$(e.currentTarget).prop('disabled', true);
		Meteor.call('mconfJoin', { rid: this.rid }, (err, result) => {
			$(e.currentTarget).prop('disabled', false);
			console.log(err, result);
			if (result) {
				popout.open({
					content: 'mconfLiveView',
					data: {
						source: result.url,
						streamingOptions: result,
						canOpenExternal: true,
						showVideoControls: false
					},
					onCloseCallback: () => console.log('bye popout')
				});
			}
		});
		// Get the link and open the iframe
	},

	'click .js-end-meeting'(e) {
		$(e.currentTarget).prop('disabled', true);
		Meteor.call('mconfEnd', { rid: this.rid }, (err, result) => {
			// $(e.currentTarget).prop('disabled', false);
			console.log(err, result);
		});
		// Get the link and open the iframe
	}
});
