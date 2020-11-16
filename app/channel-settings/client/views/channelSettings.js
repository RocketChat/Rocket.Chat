import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import s from 'underscore.string';

import { erase, hide, leave } from '../../../ui-utils';
import { ChatRoom } from '../../../models';
import { settings } from '../../../settings';
import { hasPermission, hasAllPermission } from '../../../authorization';
import { roomTypes } from '../../../utils';
import { ChannelSettings } from '../lib/ChannelSettings';
import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent('channelSettingsEditing', () => import('../../../../client/channel/ChannelInfo/EditChannel'));

const common = {
	canLeaveRoom() {
		const { cl: canLeave, t: roomType } = Template.instance().room;
		return roomType !== 'd' && canLeave !== false;
	},
	canDeleteRoom() {
		const room = ChatRoom.findOne(this.rid, {
			fields: {
				t: 1,
			},
		});

		const roomType = room && room.t;
		return roomType && roomTypes.getConfig(roomType).canBeDeleted(hasPermission, room);
	},
	canEditRoom() {
		const { _id } = Template.instance().room;
		return hasAllPermission('edit-room', _id);
	},
	isDirectMessage() {
		const { room: { t } } = Template.instance();
		return t === 'd';
	},
};

function roomFilesOnly(room) {
	if (!room.retention) {
		return;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.filesOnly;
	}

	return settings.get('RetentionPolicy_FilesOnly');
}

function roomExcludePinned(room) {
	if (!room || !room.retention) {
		return;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.excludePinned;
	}

	return settings.get('RetentionPolicy_DoNotPrunePinned');
}

function roomHasGlobalPurge(room) {
	if (!settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	switch (room.t) {
		case 'c':
			return settings.get('RetentionPolicy_AppliesToChannels');
		case 'p':
			return settings.get('RetentionPolicy_AppliesToGroups');
		case 'd':
			return settings.get('RetentionPolicy_AppliesToDMs');
	}
	return false;
}

function roomHasPurge(room) {
	if (!room || !settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	if (room.retention && room.retention.enabled !== undefined) {
		return room.retention.enabled;
	}

	return roomHasGlobalPurge(room);
}

function roomMaxAgeDefault(type) {
	switch (type) {
		case 'c':
			return settings.get('RetentionPolicy_MaxAge_Channels');
		case 'p':
			return settings.get('RetentionPolicy_MaxAge_Groups');
		case 'd':
			return settings.get('RetentionPolicy_MaxAge_DMs');
		default:
			return 30; // days
	}
}

function roomMaxAge(room) {
	if (!room) {
		return;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.maxAge;
	}

	return roomMaxAgeDefault(room.t);
}

Template.channelSettings.helpers({
	rid() {
		return Template.currentData().rid;
	},
	editing() {
		return Template.instance().editing.get();
	},
});

Template.channelSettings.onCreated(function() {
	this.room = ChatRoom.findOne(this.data && this.data.rid);
	this.editing = new ReactiveVar(false);
});

Template.channelSettings.events({
	'click .js-edit'(e, t) {
		t.editing.set(true);
	},
	'click .js-leave'(e, instance) {
		const { name, t: type } = instance.room;
		const rid = instance.room._id;
		leave(type, rid, name);
	},
	'click .js-hide'(e, instance) {
		const { name, t: type } = instance.room;
		const rid = instance.room._id;
		hide(type, rid, name);
	},
	'click .js-cancel'(e, t) {
		t.editing.set(false);
	},
	'click .js-delete'() {
		return erase(this.rid);
	},
});

Template.channelSettingsInfo.onCreated(function() {
	this.room = ChatRoom.findOne(this.data && this.data.rid);
});

Template.channelSettingsInfo.helpers({
	...common,
	rid() {
		return Template.instance().room._id;
	},
	channelName() {
		return `@${ Template.instance().room.name }`;
	},
	archived() {
		return Template.instance().room.archived;
	},
	unscape(value) {
		return s.unescapeHTML(value);
	},
	channelSettings() {
		return ChannelSettings.getOptions(Template.currentData(), 'room');
	},
	showAvatar() {
		const { room } = Template.instance();
		return !room.prid;
	},
	name() {
		const { room } = Template.instance();
		return roomTypes.getRoomName(room.t, room);
	},
	description() {
		return Template.instance().room.description;
	},
	broadcast() {
		return Template.instance().room.broadcast;
	},
	announcement() {
		return Template.instance().room.announcement;
	},
	topic() {
		return Template.instance().room.topic;
	},

	channelIcon() {
		return roomTypes.getIcon(Template.instance().room);
	},
	hasPurge() {
		return roomHasPurge(Template.instance().room);
	},
	filesOnly() {
		return roomFilesOnly(Template.instance().room);
	},
	excludePinned() {
		return roomExcludePinned(Template.instance().room);
	},
	purgeTimeout() {
		moment.relativeTimeThreshold('s', 60);
		moment.relativeTimeThreshold('ss', 0);
		moment.relativeTimeThreshold('m', 60);
		moment.relativeTimeThreshold('h', 24);
		moment.relativeTimeThreshold('d', 31);
		moment.relativeTimeThreshold('M', 12);

		return moment.duration(roomMaxAge(Template.instance().room) * 1000 * 60 * 60 * 24).humanize();
	},
});
