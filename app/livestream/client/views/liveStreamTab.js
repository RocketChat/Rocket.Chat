import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { auth } from '../oauth.js';
import { RocketChatAnnouncement } from '../../../lib';
import { popout } from '../../../ui-utils';
import { t } from '../../../utils';
import { settings } from '../../../settings';
import { callbacks } from '../../../../lib/callbacks';
import { hasAllPermission } from '../../../authorization';
import { Users, Rooms } from '../../../models';
import { handleError } from '../../../../client/lib/utils/handleError';
import { dispatchToastMessage } from '../../../../client/lib/toast';

export const call = (...args) =>
	new Promise(function (resolve, reject) {
		Meteor.call(...args, function (err, result) {
			if (err) {
				handleError(err);
				reject(err);
			}
			resolve(result);
		});
	});

export const close = (popup) =>
	new Promise(function (resolve) {
		const checkInterval = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkInterval);
				resolve();
			}
		}, 300);
	});

function optionsFromUrl(url) {
	const options = {};
	const parsedUrl = url.match(
		/(http:|https:|)\/\/(www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/|embed\?clip=)?([A-Za-z0-9._%-]*)(\&\S+)?/,
	);
	options.url = url;
	if (parsedUrl != null) {
		options.id = parsedUrl[6];
		if (parsedUrl[3].includes('youtu')) {
			options.url = `https://www.youtube.com/embed/${parsedUrl[6]}`;
			options.thumbnail = `https://img.youtube.com/vi/${parsedUrl[6]}/0.jpg`;
		}
		// @TODO add support for other urls
	}
	return options;
}

Template.liveStreamTab.helpers({
	broadcastEnabled() {
		return !!settings.get('Broadcasting_enabled');
	},
	streamingSource() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().url : '';
	},
	streamingUnavailableMessage() {
		return Template.instance().streamingOptions.get() &&
			Template.instance().streamingOptions.get().message &&
			Template.instance().streamingOptions.get().message !== ''
			? Template.instance().streamingOptions.get().message
			: t('Livestream_not_found');
	},
	thumbnailUrl() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().thumbnail : '';
	},
	hasThumbnail() {
		return (
			!!Template.instance().streamingOptions.get() &&
			!!Template.instance().streamingOptions.get().thumbnail &&
			Template.instance().streamingOptions.get().thumbnail !== ''
		);
	},
	hasSource() {
		return (
			!!Template.instance().streamingOptions.get() &&
			!!Template.instance().streamingOptions.get().url &&
			Template.instance().streamingOptions.get().url !== ''
		);
	},
	canEdit() {
		return hasAllPermission('edit-room', this.rid);
	},
	editing() {
		return (
			Template.instance().editing.get() ||
			Template.instance().streamingOptions.get() == null ||
			(Template.instance().streamingOptions.get() != null &&
				(Template.instance().streamingOptions.get().url == null || Template.instance().streamingOptions.get().url === ''))
		);
	},
	canDock() {
		const livestreamTabSource = Template.instance().streamingOptions.get().url;
		let popoutSource = null;
		try {
			if (popout.context) {
				popoutSource = Blaze.getData(popout.context).data && Blaze.getData(popout.context).data.streamingSource;
			}
			if (popoutSource != null && livestreamTabSource === popoutSource) {
				return true;
			}
		} catch (e) {
			return false;
		}
		return false;
	},
	isPopoutOpen() {
		return Template.instance().popoutOpen.get();
	},
	isAudioOnly() {
		return Template.instance().streamingOptions.get() ? Template.instance().streamingOptions.get().isAudioOnly : false;
	},
});

Template.liveStreamTab.onCreated(function () {
	this.editing = new ReactiveVar(false);
	this.streamingOptions = new ReactiveVar();
	this.popoutOpen = new ReactiveVar(popout.context != null);

	this.autorun(() => {
		const room = Rooms.findOne(this.data.rid, { fields: { streamingOptions: 1 } });
		this.streamingOptions.set(room.streamingOptions);
	});
});

Template.liveStreamTab.onDestroyed(function () {
	if (popout.docked) {
		popout.close();
	}
});

Template.liveStreamTab.events({
	'click .js-cancel'(e, i) {
		e.preventDefault();
		i.editing.set(false);
	},
	'click .js-clear'(e, i) {
		e.preventDefault();

		const clearedObject = {};

		Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', clearedObject, function (err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.streamingOptions.set(clearedObject);
			const roomAnnouncement = new RocketChatAnnouncement().getByRoom(i.data.rid);
			if (roomAnnouncement.getMessage() !== '') {
				roomAnnouncement.clear();
			}
			return dispatchToastMessage({
				type: 'success',
				message: TAPi18n.__('Livestream_source_changed_succesfully'),
			});
		});
	},
	'click .js-save'(e, i) {
		e.preventDefault();

		const streamingOptions = {
			...optionsFromUrl(i.find('[name=streaming-source]').value),
			isAudioOnly: i.find('[name=streaming-audio-only]').checked,
			message: i.find('[name=streaming-message]').value,
			type: 'livestream',
		};

		Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function (err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.streamingOptions.set(streamingOptions);
			if (streamingOptions.url !== '') {
				new RocketChatAnnouncement({
					room: i.data.rid,
					message: 'Broadcast is now live. Click here to watch!',
					callback: 'openBroadcast',
				}).save();
			} else {
				const roomAnnouncement = new RocketChatAnnouncement().getByRoom(i.data.rid);
				if (roomAnnouncement.getMessage() !== '') {
					roomAnnouncement.clear();
				}
			}

			return dispatchToastMessage({
				type: 'success',
				message: TAPi18n.__('Livestream_source_changed_succesfully'),
			});
		});
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
					showVideoControls: true,
					streamingOptions: i.streamingOptions.get(),
				},
				onCloseCallback: () => i.popoutOpen.set(false),
			});
		}
	},
	'submit .liveStreamTab__form'(e, i) {
		e.preventDefault();
		e.stopPropagation();

		const streamingOptions = {
			...optionsFromUrl(i.find('[name=streaming-source]').value),
			isAudioOnly: i.find('[name=streaming-audio-only]').checked,
			message: i.find('[name=streaming-message]').value,
			type: 'livestream',
		};

		Meteor.call('saveRoomSettings', this.rid, 'streamingOptions', streamingOptions, function (err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.streamingOptions.set(streamingOptions);
			if (streamingOptions.url !== '') {
				new RocketChatAnnouncement({
					room: i.data.rid,
					message: 'Broadcast is now live. Click here to watch!',
					callback: 'openBroadcast',
				}).save();
			} else {
				const roomAnnouncement = new RocketChatAnnouncement().getByRoom(i.data.rid);
				if (roomAnnouncement.getMessage() !== '') {
					roomAnnouncement.clear();
				}
			}
			return dispatchToastMessage({
				type: 'success',
				message: TAPi18n.__('Livestream_source_changed_succesfully'),
			});
		});
	},
	'click .js-popout'(e, i) {
		e.preventDefault();
		popout.open({
			content: 'liveStreamView',
			data: {
				streamingSource: i.streamingOptions.get().url,
				isAudioOnly: i.streamingOptions.get().isAudioOnly,
				showVideoControls: true,
				streamingOptions: i.streamingOptions.get(),
			},
			onCloseCallback: () => i.popoutOpen.set(false),
		});
		i.popoutOpen.set(true);
	},
	async 'click .js-broadcast'(e, i) {
		e.preventDefault();
		e.currentTarget.classList.add('loading');
		try {
			const user = Users.findOne({ _id: Meteor.userId() }, { fields: { 'settings.livestream': 1 } });
			if (!user.settings || !user.settings.livestream) {
				await auth();
			}
			const result = await call('livestreamGet', { rid: i.data.rid });
			popout.open({
				content: 'broadcastView',
				data: {
					...result,
					showVideoControls: false,
					showStreamControls: true,
				},
				onCloseCallback: () => i.popoutOpen.set(false),
			});
		} catch (e) {
			console.log(e);
		} finally {
			e.currentTarget.classList.remove('loading');
		}
	},
});

callbacks.add('openBroadcast', (rid) => {
	const roomData = Session.get(`roomData${rid}`);
	if (!roomData) {
		return;
	}
	popout.open({
		content: 'liveStreamView',
		data: {
			streamingSource: roomData.streamingOptions.url,
			isAudioOnly: roomData.streamingOptions.isAudioOnly,
			showVideoControls: true,
			streamingOptions: roomData.streamingOptions,
		},
	});
});
