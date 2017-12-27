import toastr from 'toastr';

Template.liveStreamTab.helpers({
	streamingSource() {
	//	return 'https://youtu.be/DZISOmiXpf4';
		return Template.instance().streamingOptions.get().url;
	},
	hasSource() {
		return !!Template.instance().streamingOptions.get() && Template.instance().streamingOptions.get().url !== '';
	},
	canEdit() {
		return RocketChat.authz.hasAllPermission('edit-room', this.rid);
	},
	editing() {
		return Template.instance().editing.get() || !Template.instance().streamingOptions.get();
	}
});

Template.liveStreamTab.onCreated(function() {
	this.editing = new ReactiveVar(false);
	this.streamingOptions = new ReactiveVar('');

	this.autorun(() => {
		const room = RocketChat.models.Rooms.findOne(this.data.rid, { fields: { streamingOptions : 1 } });
		//	if (room.streamingOptions.url !== this.streamingOptions.get().url) {
		this.streamingOptions.set(room.streamingOptions || '');
		//}
	});
});

Template.liveStreamTab.events({
	'click .js-save'(e, i) {
		e.preventDefault();

		const streamingOptions = {
			url: i.find('[name=streamingOptions]').value
		};

		Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function(err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.streamingOptions.set(streamingOptions);
			return toastr.success(TAPi18n.__('Streaming_source_changed_succesfully'));
		});
	},
	'click .streamingSourceSetting'(e, i) {
		e.preventDefault();
		i.editing.set(true);
	}
});
