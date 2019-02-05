import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { popout } from 'meteor/rocketchat:ui';

Template.videoFlexTabBbb.helpers({
	openInNewWindow() {
		return RocketChat.settings.get('Jitsi_Open_New_Window');
	},

	live() {
		const isLive = RocketChat.models.Rooms.findOne({ _id: this.rid, 'streamingOptions.type': 'call' }, { fields: { streamingOptions: 1 } }) != null;

		if (isLive === false && popout.context) {
			popout.close();
		}

		return isLive;
	},

	callManagement() {
		const type = RocketChat.models.Rooms.findOne({ _id: this.rid }).t;
		return type === 'd' || RocketChat.authz.hasAllPermission('call-management') || RocketChat.authz.hasAllPermission('call-management', this.rid);
	},
});

Template.videoFlexTabBbb.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.videoFlexTabBbb.events({
	'click .js-join-meeting'(e) {
		$(e.currentTarget).prop('disabled', true);
		Meteor.call('bbbJoin', { rid: this.rid }, (err, result) => {
			$(e.currentTarget).prop('disabled', false);
			console.log(err, result);
			if (result) {
				popout.open({
					content: 'bbbLiveView',
					data: {
						source: result.url,
						streamingOptions: result,
						canOpenExternal: true,
						showVideoControls: false,
					},
					onCloseCallback: () => console.log('bye popout'),
				});
			}
		});
		// Get the link and open the iframe
	},

	'click .js-end-meeting'(e) {
		$(e.currentTarget).prop('disabled', true);
		Meteor.call('bbbEnd', { rid: this.rid }, (err, result) => {
			// $(e.currentTarget).prop('disabled', false);
			console.log(err, result);
		});
		// Get the link and open the iframe
	},
});
