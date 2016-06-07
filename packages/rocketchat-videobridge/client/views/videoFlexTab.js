Template.videoFlexTab.helpers({
	videoAvaliable() {
		return true;
	},

	videoActive() {
		return false;
	},

	callInProgress() {
		return false;
	}

});


Template.videoFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {

	});

});

Template.videoFlexTab.events({
	'click .start-video-call': () => {
		var domain = "meet.jit.si"; // Need to get from config
		var room = "a124124124124124125125125"; // Need to calc from instance id and room id
		var width = 500;
		var height = 300;

		var configOverwrite = {};
		var interfaceConfigOverwrite = {

		};
		var api = new JitsiMeetExternalAPI(domain, room, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, true);
		
		api.executeCommand('displayName', [Meteor.user().name]);
	},

	'click .start-audio-call': () => {
		var domain = "meet.jit.si"; // Need to get from config
		var room = "a124124124124124125125125"; // Need to calc from instance id and room id
		var width = 500;
		var height = 300;

		var configOverwrite = {};
		var interfaceConfigOverwrite = {

		};
		var api = new JitsiMeetExternalAPI(domain, room, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, true);

		api.executeCommand('displayName', [Meteor.user().name]);
	},

	'click .join-video-call': () => {
	},

	'click .join-audio-call': () => {
	}

});
