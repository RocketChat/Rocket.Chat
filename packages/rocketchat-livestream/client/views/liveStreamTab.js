/* globals popout */
import toastr from 'toastr';

function parseUrl(url) {
	const options = {};
	const parsedUrl = url.match(/(http:|https:|)\/\/(www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/|embed\?clip=)?([A-Za-z0-9._%-]*)(\&\S+)?/);
	options.url = url;
	if (parsedUrl != null) {
		options.id = parsedUrl[6];
		if (parsedUrl[3].includes('youtu')) {
			options.url = `https://www.youtube.com/embed/${ parsedUrl[6] }`;
			options.thumbnail = `https://img.youtube.com/vi/${ parsedUrl[6] }/0.jpg`;
		}
		// @TODO add support for other urls
	}
	return options;
}

Template.liveStreamTab.helpers({
	streamingSource() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().url : '';
	},
	thumbnailUrl() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().thumbnail : '';
	},
	hasThumbnail() {
		return !!Template.instance().streamingOptions.get() && !!Template.instance().streamingOptions.get().thumbnail && Template.instance().streamingOptions.get().thumbnail !== '';
	},
	hasSource() {
		return !!Template.instance().streamingOptions.get() && !!Template.instance().streamingOptions.get().url && Template.instance().streamingOptions.get().url !== '';
	},
	canEdit() {
		return RocketChat.authz.hasAllPermission('edit-room', this.rid);
	},
	editing() {
		return Template.instance().editing.get() || Template.instance().streamingOptions.get() == null || (Template.instance().streamingOptions.get() != null && (Template.instance().streamingOptions.get().url == null || Template.instance().streamingOptions.get().url === ''));
	},
	canDock() {
		const livestreamTabSource = Template.instance().streamingOptions.get().url;
		let popoutSource = null;
		try {
			if (popout.context) {
				popoutSource = Blaze.getData(popout.context).data && Blaze.getData(popout.context).data.streamingSource;
			}
		} catch (e) {
			return false;
		} finally {
			if (popoutSource != null && livestreamTabSource === popoutSource) {
				return true;
			} else {
				return false;
			}
		}
	},
	isPopoutOpen() {
		return Template.instance().popoutOpen.get();
	},
	isAudioOnly() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().isAudioOnly : false;
	}
});

Template.liveStreamTab.onCreated(function() {
	this.editing = new ReactiveVar(false);
	this.streamingOptions = new ReactiveVar();
	this.popoutOpen = new ReactiveVar(popout.context != null);

	this.autorun(() => {
		const room = RocketChat.models.Rooms.findOne(this.data.rid, { fields: { streamingOptions : 1 } });
		this.streamingOptions.set(room.streamingOptions);
	});
});

Template.liveStreamTab.onDestroyed(function() {
	if (popout.docked) {
		popout.close();
	}
});


Template.liveStreamTab.events({
	'click .js-cancel'(e, i) {
		e.preventDefault();
		i.editing.set(false);
	},
	'click .js-save'(e, i) {
		e.preventDefault();

		const streamingOptions = {
			...parseUrl(i.find('[name=streaming-source]').value),
			isAudioOnly: i.find('[name=streaming-audio-only]').checked
		};

		if (streamingOptions.id != null) {
			Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function(err) {
				if (err) {
					return handleError(err);
				}
				i.editing.set(false);
				i.streamingOptions.set(streamingOptions);
				return toastr.success(TAPi18n.__('Livestream_source_changed_succesfully'));
			});
		} else {
			return toastr.error(TAPi18n.__('Livestream_url_incorrect'));
		}
	},
	'click .streaming-source-settings'(e, i) {
		e.preventDefault();
		i.editing.set(true);
	},
	'click .js-dock'(e) {
		e.stopPropagation();
		popout.docked = true;
	},
	'click .js-close'(e, i) {
		e.stopPropagation();
		let popoutSource = '';
		if (popout.context) {
			popoutSource = Blaze.getData(popout.context).data && Blaze.getData(popout.context).data.streamingSource;
		}
		popout.close();
		if (popoutSource !== Template.instance().streamingOptions.get().url) {
			popout.open({
				content: 'liveStreamView',
				data: {
					streamingSource: i.streamingOptions.get().url,
					isAudioOnly: i.streamingOptions.get().isAudioOnly,
					streamingOptions:  i.streamingOptions.get()
				},
				onCloseCallback: () => i.popoutOpen.set(false)
			});
		}
	},
	'submit .liveStreamTab__form'(e, i) {
		e.preventDefault();
		e.stopPropagation();

		const streamingOptions = {
			...parseUrl(i.find('[name=streaming-source]').value),
			isAudioOnly: i.find('[name=streaming-audio-only]').checked
		};

		if (streamingOptions.id != null) {
			Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function(err) {
				if (err) {
					return handleError(err);
				}
				i.editing.set(false);
				i.streamingOptions.set(streamingOptions);
				return toastr.success(TAPi18n.__('Livestream_source_changed_succesfully'));
			});
		} else {
			return toastr.error(TAPi18n.__('Livestream_url_incorrect'));
		}
	},
	'click .js-popout'(e, i) {
		e.preventDefault();
		popout.open({
			content: 'liveStreamView',
			data: {
				streamingSource: i.streamingOptions.get().url,
				isAudioOnly: i.streamingOptions.get().isAudioOnly,
				streamingOptions:  i.streamingOptions.get()
			},
			onCloseCallback: () => i.popoutOpen.set(false)
		});
		i.popoutOpen.set(true);
	}
});
