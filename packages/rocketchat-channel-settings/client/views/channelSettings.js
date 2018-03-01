import toastr from 'toastr';
import s from 'underscore.string';
import { call, erase, hide, leave, RocketChat, RoomSettingsEnum } from 'meteor/rocketchat:lib';
const common = {
	canLeaveRoom() {
		const { cl: canLeave, t: roomType } = Template.instance().room;
		return roomType !== 'd' && canLeave !== false;
	},
	canDeleteRoom() {
		const room = ChatRoom.findOne(this.rid, {
			fields: {
				t: 1
			}
		});

		const roomType = room && room.t;
		return roomType && RocketChat.roomTypes.roomTypes[room.t].canBeDeleted(room);
	},
	canEditRoom() {
		const { _id } = Template.instance().room;
		return RocketChat.authz.hasAllPermission('edit-room', _id);
	},
	isDirectMessage() {
		const { room } = Template.instance();
		return room.t === 'd';
	}
};

Template.channelSettingsEditing.events({
	'input .js-input'(e) {
		this.value.set(e.currentTarget.value);
	},
	'change .js-input-check'(e) {
		this.value.set(e.currentTarget.checked);
	},
	'click .js-reset'(e, t) {
		const { settings } = t;
		Object.keys(settings).forEach(key => settings[key].value.set(settings[key].default.get()));
	},
	async 'click .js-save'(e, t) {
		const { settings } = t;
		Object.keys(settings).forEach(async name => {
			const setting = settings[name];
			const value = setting.value.get();
			if (setting.default.get() !== value) {
				await setting.save(value).then(() => {
					setting.default.set(value);
					setting.value.set(value);
				}, console.log);
			}
		});
	}
});

Template.channelSettingsEditing.onCreated(function() {
	const room = this.room = ChatRoom.findOne(this.data && this.data.rid);
	this.settings = {
		name: {
			type: 'text',
			label: 'Name',
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.NAME);
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			getValue() {
				if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
					return room.fname || room.name;
				}

				return room.name;
			},
			save(value) {
				let nameValidation;

				if (!RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
					try {
						nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
					} catch (error1) {
						nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
					}

					if (!nameValidation.test(value)) {
						return Promise.reject(toastr.error(t('error-invalid-room-name', {
							room_name: {
								name: value
							}
						})));
					}
				}
				return call('saveRoomSettings', room._id, RoomSettingsEnum.NAME, value).then(function() {
					RocketChat.callbacks.run('roomNameChanged', {
						_id: room._id,
						name: value
					});

					return toastr.success(TAPi18n.__('Room_name_changed_successfully'));
				});
			}
		},
		topic: {
			type: 'markdown',
			label: 'Topic',
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.TOPIC);
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.TOPIC, value).then(function() {
					toastr.success(TAPi18n.__('Room_topic_changed_successfully'));
					return RocketChat.callbacks.run('roomTopicChanged', room);
				});
			}
		},
		announcement: {
			type: 'markdown',
			label: 'Announcement',
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.ANNOUNCEMENT);
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.ANNOUNCEMENT, value).then(() => {
					toastr.success(TAPi18n.__('Room_announcement_changed_successfully'));
					return RocketChat.callbacks.run('roomAnnouncementChanged', room);
				});
			}
		},
		description: {
			type: 'text',
			label: 'Description',
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.DESCRIPTION);
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.DESCRIPTION, value).then(function() {
					return toastr.success(TAPi18n.__('Room_description_changed_successfully'));
				});
			}
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
				return room['default'] && !RocketChat.authz.hasRole(Meteor.userId(), 'admin');
			},
			message() {
				if (RocketChat.authz.hasAllPermission('edit-room', room._id) && room['default']) {
					if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
						return 'Room_type_of_default_rooms_cant_be_changed';
					}
				}
			},
			canView() {
				if (!['c', 'p'].includes(room.t)) {
					return false;
				} else if (room.t === 'p' && !RocketChat.authz.hasAllPermission('create-c')) {
					return false;
				} else if (room.t === 'c' && !RocketChat.authz.hasAllPermission('create-p')) {
					return false;
				}
				return true;
			},
			canEdit() {
				return (RocketChat.authz.hasAllPermission('edit-room', room._id) && !room['default']) || RocketChat.authz.hasRole(Meteor.userId(), 'admin');
			},
			save(value) {
				const saveRoomSettings = () => {
					value = value ? 'p' : 'c';
					RocketChat.callbacks.run('roomTypeChanged', room);
					return call('saveRoomSettings', room._id, 'roomType', value).then(() => {
						return toastr.success(TAPi18n.__('Room_type_changed_successfully'));
					});
				};
				if (room['default']) {
					if (RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
						return new Promise((resolve, reject) => {
							modal.open({
								title: t('Room_default_change_to_private_will_be_default_no_more'),
								type: 'warning',
								showCancelButton: true,
								confirmButtonColor: '#DD6B55',
								confirmButtonText: t('Yes'),
								cancelButtonText: t('Cancel'),
								closeOnConfirm: true,
								html: false
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
			}
		},
		ro: {
			type: 'boolean',
			label: 'Read_only',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.READ_ONLY);
			},
			canEdit() {
				return !room.broadcast && RocketChat.authz.hasAllPermission('set-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, RoomSettingsEnum.READ_ONLY, value).then(() => toastr.success(TAPi18n.__('Read_only_changed_successfully')));
			}
		},
		reactWhenReadOnly: {
			type: 'boolean',
			label: 'React_when_read_only',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.REACT_WHEN_READ_ONLY);
			},
			canEdit() {
				return !room.broadcast && RocketChat.authz.hasAllPermission('set-react-when-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'reactWhenReadOnly', value).then(() => {
					toastr.success(TAPi18n.__('React_when_read_only_changed_successfully'));
				});
			}
		},
		archived: {
			type: 'boolean',
			label: 'Room_archivation_state_true',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE);
			},
			canEdit() {
				return RocketChat.authz.hasAtLeastOnePermission(['archive-room', 'unarchive-room'], room._id);
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
						html: false
					}, function(confirmed) {
						if (confirmed) {
							const action = value ? 'archiveRoom' : 'unarchiveRoom';
							return resolve(call(action, room._id).then(() => {
								modal.open({
									title: value ? t('Room_archived') : t('Room_has_been_archived'),
									text: value ? t('Room_has_been_archived') : t('Room_has_been_unarchived'),
									type: 'success',
									timer: 2000,
									showConfirmButton: false
								});
								return RocketChat.callbacks.run(action, room);
							}));
						}
						return reject();
					});
				});
			}
		},
		broadcast: {
			type: 'boolean',
			label: 'Broadcast_channel',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.BROADCAST);
			},
			canEdit() {
				return false;
			},
			save() {
				return Promise.resolve();
			}
		},
		joinCode: {
			type: 'text',
			label: 'Password',
			showingValue: new ReactiveVar(false),
			realValue: null,
			canView() {
				return RocketChat.roomTypes.roomTypes[room.t].allowRoomSettingChange(room, RoomSettingsEnum.JOIN_CODE) && RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
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
				return call('getRoomJoinCode', room._id).then(result => {
					this.realValue = result;
					this.showingValue.set(true);
				});
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'joinCode', value).then(function() {
					toastr.success(TAPi18n.__('Room_password_changed_successfully'));
					return RocketChat.callbacks.run('roomCodeChanged', room);
				});
			}
		}
	};
	Object.keys(this.settings).forEach(key => {
		const setting = this.settings[key];
		const def = setting.getValue ? setting.getValue(this.room) : this.room[key];
		setting.default = new ReactiveVar(def || false);
		setting.value = new ReactiveVar(def || false);
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
		return !Object.keys(settings).some(key => settings[key].default.get() !== settings[key].value.get()) ? text : '';
	},
	equal(text = '', text2 = '', ret = '*') {
		return text === text2 ? '' : ret;
	},
	getIcon(room) {
		const roomType = RocketChat.models.Rooms.findOne(room._id).t;
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
		return (typeof setting.disabled === 'function' && setting.disabled(room)) || setting.processing.get() || !RocketChat.authz.hasAllPermission('edit-room', room._id);
	},
	unscape(value) {
		return s.unescapeHTML(value);
	}
});

Template.channelSettings.helpers({
	editing() {
		return Template.instance().editing.get();
	}
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
	}
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
		return RocketChat.ChannelSettings.getOptions(Template.currentData(), 'room');
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
	users() {
		return Template.instance().room.usernames;
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
	}
});
