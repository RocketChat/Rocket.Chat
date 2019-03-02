import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';
import moment from 'moment';
import s from 'underscore.string';
import { modal, popover, call, erase, hide, leave } from 'meteor/rocketchat:ui-utils';
import { ChatRoom, Rooms } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { hasPermission, hasAllPermission, hasRole, hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { t, roomTypes, RoomSettingsEnum } from 'meteor/rocketchat:utils';
import { ChannelSettings } from '../lib/ChannelSettings';

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
		return roomType && roomTypes.roomTypes[roomType].canBeDeleted(hasPermission, room);
	},
	canEditRoom() {
		const { _id } = Template.instance().room;
		return hasAllPermission('edit-room', _id);
	},
	isDirectMessage() {
		const { room } = Template.instance();
		return room.t === 'd';
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

	return settings.get('RetentionPolicy_ExcludePinned');
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

function retentionEnabled({ t: type }) {
	switch (type) {
		case 'c':
			return settings.get('RetentionPolicy_AppliesToChannels');
		case 'p':
			return settings.get('RetentionPolicy_AppliesToGroups');
		case 'd':
			return settings.get('RetentionPolicy_AppliesToDMs');
	}
	return false;
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

const fixRoomName = (old) => {
	if (settings.get('UI_Allow_room_names_with_special_chars')) {
		return old;
	}
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
};

Template.channelSettingsEditing.events({
	'input [name="name"]'(e) {
		const input = e.currentTarget;
		const modified = fixRoomName(input.value);
		input.value = modified;
	},
	'input .js-input'(e) {
		this.value.set(e.currentTarget.value);
	},
	'change .js-input-check'(e) {
		this.value.set(e.currentTarget.checked);
	},
	'click .js-reset'(e, t) {
		const { settings } = t;
		Object.keys(settings).forEach((key) => settings[key].value.set(settings[key].default.get()));
	},

	'click .rc-user-info__config-value'(e) {
		const options = [{
			id: 'prune_default',
			name: 'prune_value',
			label: 'Default',
			value: 'default',
		},
		{
			id: 'prune_enabled',
			name: 'prune_value',
			label: 'Enabled',
			value: 'enabled',
		},
		{
			id: 'prune_disabled',
			name: 'prune_value',
			label: 'Disabled',
			value: 'disabled',
		}];

		const falseOrDisabled = this.value.get() === false ? 'disabled' : 'default';
		const value = this.value.get() ? 'enabled' : falseOrDisabled;
		const config = {
			popoverClass: 'notifications-preferences',
			template: 'pushNotificationsPopover',
			data: {
				change : (value) => {
					const falseOrUndefined = value === 'disabled' ? false : undefined;
					const realValue = value === 'enabled' ? true : falseOrUndefined;
					return this.value.set(realValue);
				},
				value,
				options,
			},
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
	async 'click .js-save'(e, t) {
		const { settings } = t;
		Object.keys(settings).forEach(async(name) => {
			const setting = settings[name];
			const value = setting.value.get();
			if (setting.default.get() !== value) {
				await setting.save(value).then(() => {
					setting.default.set(value);
					setting.value.set(value);
				}, console.log);
			}
		});
	},
});

Template.channelSettingsEditing.onCreated(function() {
	const room = this.room = ChatRoom.findOne(this.data && this.data.rid);
	this.settings = {
		name: {
			type: 'text',
			label: 'Name',
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.NAME);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			getValue() {
				if (settings.get('UI_Allow_room_names_with_special_chars')) {
					return room.fname || room.name;
				}

				return room.name;
			},
			save(value) {
				let nameValidation;

				if (!settings.get('UI_Allow_room_names_with_special_chars')) {
					try {
						nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
					} catch (error1) {
						nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
					}

					if (!nameValidation.test(value)) {
						return Promise.reject(toastr.error(t('error-invalid-room-name', {
							room_name: {
								name: value,
							},
						})));
					}
				}
				return call('saveRoomSettings', room._id, RoomSettingsEnum.NAME, value).then(function() {
					callbacks.run('roomNameChanged', {
						_id: room._id,
						name: value,
					});

					return toastr.success(t('Room_name_changed_successfully'));
				});
			},
		},
		topic: {
			type: 'markdown',
			label: 'Topic',
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.TOPIC);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.TOPIC, value).then(function() {
					toastr.success(t('Room_topic_changed_successfully'));
					return callbacks.run('roomTopicChanged', room);
				});
			},
		},
		announcement: {
			type: 'markdown',
			label: 'Announcement',
			getValue() {
				return Template.instance().room.announcement;
			},
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.ANNOUNCEMENT);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.ANNOUNCEMENT, value).then(() => {
					toastr.success(t('Room_announcement_changed_successfully'));
					return callbacks.run('roomAnnouncementChanged', room);
				});
			},
		},
		description: {
			type: 'text',
			label: 'Description',
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.DESCRIPTION);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.DESCRIPTION, value).then(function() {
					return toastr.success(t('Room_description_changed_successfully'));
				});
			},
		},
		t: {
			type: 'boolean',
			// label() {
			// 	return ;
			// },
			isToggle: true,
			processing: new ReactiveVar(false),
			getValue() {
				return room.t === 'p';
			},
			disabled() {
				return room.default && !hasRole(Meteor.userId(), 'admin');
			},
			message() {
				if (hasAllPermission('edit-room', room._id) && room.default) {
					if (!hasRole(Meteor.userId(), 'admin')) {
						return 'Room_type_of_default_rooms_cant_be_changed';
					}
				}
			},
			canView() {
				if (!['c', 'p'].includes(room.t)) {
					return false;
				} else if (room.t === 'p' && !hasAllPermission('create-c')) {
					return false;
				} else if (room.t === 'c' && !hasAllPermission('create-p')) {
					return false;
				}
				return true;
			},
			canEdit() {
				return (hasAllPermission('edit-room', room._id) && !room.default) || hasRole(Meteor.userId(), 'admin');
			},
			save(value) {
				const saveRoomSettings = () => {
					value = value ? 'p' : 'c';
					callbacks.run('roomTypeChanged', room);
					return call('saveRoomSettings', room._id, 'roomType', value).then(() => toastr.success(t('Room_type_changed_successfully')));
				};
				if (room.default) {
					if (hasRole(Meteor.userId(), 'admin')) {
						return new Promise((resolve, reject) => {
							modal.open({
								title: t('Room_default_change_to_private_will_be_default_no_more'),
								type: 'warning',
								showCancelButton: true,
								confirmButtonColor: '#DD6B55',
								confirmButtonText: t('Yes'),
								cancelButtonText: t('Cancel'),
								closeOnConfirm: true,
								html: false,
							}, function(confirmed) {
								if (confirmed) {
									return resolve(saveRoomSettings());
								}
								return reject();
							});

						});
					}
					// return $('.channel-settings form [name=\'t\']').prop('checked', !!room.type === 'p');
				}
				return saveRoomSettings();
			},
		},
		ro: {
			type: 'boolean',
			label: 'Read_only',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.READ_ONLY);
			},
			canEdit() {
				return !room.broadcast && hasAllPermission('set-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.READ_ONLY, value).then(() => toastr.success(t('Read_only_changed_successfully')));
			},
		},
		reactWhenReadOnly: {
			type: 'boolean',
			label: 'React_when_read_only',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.REACT_WHEN_READ_ONLY);
			},
			canEdit() {
				return !room.broadcast && hasAllPermission('set-react-when-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'reactWhenReadOnly', value).then(() => {
					toastr.success(t('React_when_read_only_changed_successfully'));
				});
			},
		},
		sysMes: {
			type: 'boolean',
			label: 'System_messages',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(
					room,
					RoomSettingsEnum.SYSTEM_MESSAGES
				);
			},
			getValue() {
				return room.sysMes !== false;
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'systemMessages', value).then(
					() => {
						toastr.success(
							t('System_messages_setting_changed_successfully')
						);
					}
				);
			},
		},
		archived: {
			type: 'boolean',
			label: 'Room_archivation_state_true',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE);
			},
			canEdit() {
				return hasAtLeastOnePermission(['archive-room', 'unarchive-room'], room._id);
			},
			save(value) {
				return new Promise((resolve, reject) => {
					modal.open({
						title: t('Are_you_sure'),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: value ? t('Yes_archive_it') : t('Yes_unarchive_it'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: false,
						html: false,
					}, function(confirmed) {
						if (confirmed) {
							const action = value ? 'archiveRoom' : 'unarchiveRoom';
							return resolve(call(action, room._id).then(() => {
								modal.open({
									title: value ? t('Room_archived') : t('Room_has_been_archived'),
									text: value ? t('Room_has_been_archived') : t('Room_has_been_unarchived'),
									type: 'success',
									timer: 2000,
									showConfirmButton: false,
								});
								return callbacks.run(action, room);
							}));
						}
						return reject();
					});
				});
			},
		},
		broadcast: {
			type: 'boolean',
			label: 'Broadcast_channel',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.BROADCAST);
			},
			canEdit() {
				return false;
			},
			save() {
				return Promise.resolve();
			},
		},
		joinCode: {
			type: 'text',
			label: 'Password',
			showingValue: new ReactiveVar(false),
			realValue: null,
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.JOIN_CODE) && hasAllPermission('edit-room', room._id);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			getValue() {
				if (this.showingValue.get()) {
					return this.realValue;
				}
				return room.joinCodeRequired ? '*****' : '';
			},
			showHideValue() {
				return room.joinCodeRequired;
			},
			cancelEditing() {
				this.showingValue.set(false);
				this.realValue = null;
			},
			async showValue(_room, forceShow = false) {
				if (this.showingValue.get()) {
					if (forceShow) {
						return;
					}
					this.showingValue.set(false);
					this.realValue = null;

					return null;
				}
				return call('getRoomJoinCode', room._id).then((result) => {
					this.realValue = result;
					this.showingValue.set(true);
				});
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'joinCode', value).then(function() {
					toastr.success(t('Room_password_changed_successfully'));
					return callbacks.run('roomCodeChanged', room);
				});
			},
		},
		retentionEnabled: {
			type: 'boolean',
			label: 'RetentionPolicyRoom_Enabled',
			processing: new ReactiveVar(false),
			getValue() {
				const { room = {} } = Template.instance() || {};
				return room.retention && room.retention.enabled;
			},
			canView() {
				return true;
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'retentionEnabled', value).then(() => toastr.success(t('Retention_setting_changed_successfully')));
			},
		},
		retentionOverrideGlobal: {
			type: 'boolean',
			label: 'RetentionPolicyRoom_OverrideGlobal',
			isToggle: true,
			processing: new ReactiveVar(false),
			getValue() {
				return Template.instance().room.retention && Template.instance().room.retention.overrideGlobal;
			},
			canView() {
				return true;
			},
			canEdit() {
				return hasAllPermission('edit-privileged-setting', room._id);
			},
			disabled() {
				return !hasAllPermission('edit-privileged-setting', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'retentionOverrideGlobal', value).then(
					() => {
						toastr.success(
							t('Retention_setting_changed_successfully')
						);
					}
				);
			},
		},
		retentionMaxAge: {
			type: 'number',
			label: 'RetentionPolicyRoom_MaxAge',
			processing: new ReactiveVar(false),
			getValue() {
				const { room } = Template.instance();
				return Math.min(roomMaxAge(room), roomMaxAgeDefault(room.t));
			},
			canView() {
				return true;
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'retentionMaxAge', value).then(
					() => {
						toastr.success(
							t('Retention_setting_changed_successfully')
						);
					}
				);
			},
		},
		retentionExcludePinned: {
			type: 'boolean',
			label: 'RetentionPolicyRoom_ExcludePinned',
			isToggle: true,
			processing: new ReactiveVar(false),
			getValue() {
				return Template.instance().room.retention && Template.instance().room.retention.excludePinned;
			},
			canView() {
				return true;
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'retentionExcludePinned', value).then(
					() => {
						toastr.success(
							t('Retention_setting_changed_successfully')
						);
					}
				);
			},
		},
		retentionFilesOnly: {
			type: 'boolean',
			label: 'RetentionPolicyRoom_FilesOnly',
			isToggle: true,
			processing: new ReactiveVar(false),
			getValue() {
				return Template.instance().room.retention && Template.instance().room.retention.filesOnly;
			},
			canView() {
				return true;
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'retentionFilesOnly', value).then(
					() => {
						toastr.success(
							t('Retention_setting_changed_successfully')
						);
					}
				);
			},
		},
		encrypted: {
			type: 'boolean',
			label: 'Encrypted',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.E2E);
			},
			canEdit() {
				return hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'encrypted', value).then(() => {
					toastr.success(
						t('Encrypted_setting_changed_successfully')
					);
				});
			},
		},
	};
	Object.keys(this.settings).forEach((key) => {
		const setting = this.settings[key];
		const def = setting.getValue ? setting.getValue(this.room) : (this.room[key] || false);
		setting.default = new ReactiveVar(def);
		setting.value = new ReactiveVar(def);
	});
});

Template.channelSettingsEditing.helpers({
	...common,
	value() {
		return this.value.get();
	},
	default() {
		return this.default.get();
	},
	disabled() {
		return !this.canEdit();
	},
	checked() {
		return this.value.get();// ? '' : 'checked';
	},
	modified(text = '') {
		const { settings } = Template.instance();
		return !Object.keys(settings).some((key) => settings[key].default.get() !== settings[key].value.get()) ? text : '';
	},
	equal(text = '', text2 = '', ret = '*') {
		return text === text2 ? '' : ret;
	},
	getIcon(room) {
		const roomType = Rooms.findOne(room._id).t;
		switch (roomType) {
			case 'd':
				return 'at';
			case 'p':
				return 'lock';
			case 'c':
				return 'hashtag';
			case 'l':
				return 'livechat';
			default:
				return null;
		}
	},
	settings() {
		return Template.instance().settings;
	},
	editing(field) {
		return Template.instance().editing.get() === field;
	},
	isDisabled(field, room) {
		const setting = Template.instance().settings[field];
		return (typeof setting.disabled === 'function' && setting.disabled(room)) || setting.processing.get() || !hasAllPermission('edit-room', room._id);
	},
	unscape(value) {
		return s.unescapeHTML(value);
	},
	hasRetentionPermission() {
		const { room } = Template.instance();

		return settings.get('RetentionPolicy_Enabled') && hasAllPermission('edit-room-retention-policy', room._id);
	},
	subValue(value) {
		if (value === undefined) {
			const text = t(retentionEnabled(Template.instance().room) ? 'enabled' : 'disabled');
			const _default = t('default');
			return `${ text } (${ _default })`;
		}
		return t(value ? 'enabled' : 'disabled');
	},
	retentionEnabled(value) {
		const { room } = Template.instance();
		return (value || value === undefined) && retentionEnabled(room);
	},
	retentionMaxAgeLabel(label) {
		const { room } = Template.instance();
		return TAPi18n.__(label, { max: roomMaxAgeDefault(room.t) });
	},
});

Template.channelSettings.helpers({
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
	name() {
		return Template.instance().room.name;
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
		const roomType = Template.instance().room.t;
		switch (roomType) {
			case 'd':
				return 'at';
			case 'p':
				return 'lock';
			case 'c':
				return 'hashtag';
			case 'l':
				return 'livechat';
			default:
				return null;
		}
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
