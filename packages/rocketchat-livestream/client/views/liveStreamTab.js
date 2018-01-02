/* globals popout */
import toastr from 'toastr';

function parseUrl(url) {
	const parsedUrl = url.match(/(http:|https:|)\/\/(clips.|player.|www.)?(twitch\.tv|vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/|embed\?clip=)?([A-Za-z0-9._%-]*)(\&\S+)?/);
	let source = url;
	if (parsedUrl != null) {
		if (parsedUrl[3].includes('youtu')) {
			source = `https://www.youtube.com/embed/${ parsedUrl[6] }?showinfo=0`;
		} else if (parsedUrl[3].includes('vimeo')) {
			source = `https://player.vimeo.com/video/${ parsedUrl[6] }`;
		} else if (parsedUrl[3].includes('twitch')) {
			source = `http://player.twitch.tv/?channel=${ parsedUrl[6] }`;
		}
		// @TODO add support for other urls
		return source;
	}
}

Template.liveStreamTab.helpers({
	streamingSource() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().url : '';
	},
	hasSource() {
		return !!Template.instance().streamingOptions.get() && Template.instance().streamingOptions.get().url !== '';
	},
	canEdit() {
		return RocketChat.authz.hasAllPermission('edit-room', this.rid);
	},
	editing() {
		return Template.instance().editing.get() || Template.instance().streamingOptions.get() == null || (Template.instance().streamingOptions.get() != null && (Template.instance().streamingOptions.get().url == null || Template.instance().streamingOptions.get().url === ''));
	},
	canDock() {
		const livestreamTabSource = Template.instance().streamingOptions.get().url;
		const popoutSource = Blaze.getData(popout.context).data && Blaze.getData(popout.context).data.streamingSource;
		if (livestreamTabSource === popoutSource) {
			return true;
		} else {
			return false;
		}
	},
	isDocked() {
		return popout.docked;
	}
});

Template.liveStreamTab.onCreated(function() {
	this.editing = new ReactiveVar(false);
	this.streamingOptions = new ReactiveVar();

	this.autorun(() => {
		const room = RocketChat.models.Rooms.findOne(this.data.rid, { fields: { streamingOptions : 1 } });
		this.streamingOptions.set(room.streamingOptions);
	});
	if (popout.context == null) {
		popout.open({
			content: 'liveStreamView',
			data: {
				'streamingSource': this.streamingOptions.get().url
			}
		});
	}
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
			url: parseUrl(i.find('[name=streamingOptions]').value)
		};

		Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function(err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.streamingOptions.set(streamingOptions);
			return toastr.success(TAPi18n.__('Livestream_source_changed_succesfully'));
		});
	},
	'click .streamingSourceSetting'(e, i) {
		e.preventDefault();
		i.editing.set(true);
	},
	'click .js-dock'(e) {
		e.stopPropagation();
		popout.docked = true;
	},
	'click .js-close'(e) {
		e.stopPropagation();
		popout.close();
		popout.open({
			content: 'liveStreamView',
			data: {
				'streamingSource': Template.instance().streamingOptions.get().url
			}
		});
	}
});
