import toastr from 'toastr';
import s from 'underscore.string';

const can = {
	canLeaveRoom() {
		const { cl: canLeave, t: roomType } = Template.instance().room;
		return roomType !== 'd' && canLeave !== false;
	},
	canDeleteRoom() {
		const {room} = Template.instance();
		const roomType = room && room.t;
		return roomType && RocketChat.authz.hasAtLeastOnePermission(`delete-${ roomType }`, room._id);
	},
	canEditRoom() {
		const { _id } = Template.instance().room;
		return RocketChat.authz.hasAllPermission('edit-room', _id);
	}
};

const call = (method, ...params) => {
	return new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (err, result)=> {
			if (err) {
				handleError(err);
				return reject(err);
			}
			return resolve(result);
		});
	});
};

Template.channelSettingsEditing.events({
	'input .js-input'(e) {
		this.value.set(e.currentTarget.value);
	},
	'change .js-input-check'(e) {
		this.value.set(e.currentTarget.checked);
	},
	'click .js-reset'(e, t) {
		const {settings} = t;
		Object.keys(settings).forEach(key => settings[key].value.set(settings[key].default.get()));
	},
	async 'click .js-save'(e, t) {
		const {settings} = t;
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
				return room.t !== 'd';
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
				if (!RocketChat.authz.hasAllPermission('edit-room', room._id) || (room.t !== 'c' && room.t !== 'p')) {
					return Promise.reject(toastr.error(t('error-not-allowed')));
				}
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
				return call('saveRoomSettings', room._id, 'roomName', value).then(function() {
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
				return true;
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'roomTopic', value).then(function() {
					toastr.success(TAPi18n.__('Room_topic_changed_successfully'));
					return RocketChat.callbacks.run('roomTopicChanged', room);
				});
			}
		},
		announcement: {
			type: 'markdown',
			label: 'Announcement',
			canView() {
				return true;
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'roomAnnouncement', value).then(() => {
					toastr.success(TAPi18n.__('Room_announcement_changed_successfully'));
					return RocketChat.callbacks.run('roomAnnouncementChanged', room);
				});
			}
		},
		description: {
			type: 'text',
			label: 'Description',
			canView() {
				return room.t !== 'd';
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('edit-room', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'roomDescription', value).then(function() {
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
				if (['c', 'p'].includes(room.t) === false) {
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
						return new Promise((resolve, reject)=> {
							swal({
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
				return room.t !== 'd';
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('set-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'readOnly', value).then(() => toastr.success(TAPi18n.__('Read_only_changed_successfully')));
			}
		},
		reactWhenReadOnly: {
			type: 'boolean',
			label: 'React_when_read_only',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView: () => {
				return this.settings.t.value && this.settings.t.value.get() !== 'd' && this.settings.ro.value.get();
			},
			canEdit() {
				return RocketChat.authz.hasAllPermission('set-react-when-readonly', room._id);
			},
			save(value) {
				return call('saveRoomSettings', room._id, 'reactWhenReadOnly', value).then(() => {
					return toastr.success(TAPi18n.__('React_when_read_only_changed_successfully'));
				});
			}
		},
		archived: {
			type: 'boolean',
			label: 'Room_archivation_state_true',
			isToggle: true,
			processing: new ReactiveVar(false),
			canView: () => {
				return this.settings.t.value && this.settings.t.value.get() !== 'd';
			},
			canEdit() {
				return RocketChat.authz.hasAtLeastOnePermission(['archive-room', 'unarchive-room'], room._id);
			},
			save(value) {
				return new Promise((resolve, reject)=>{
					swal({
						title: t('Are_you_sure'),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: value ? t('Yes_archive_it') : t('Yes_unarchive_it'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: false,
						html: false
					}, function(confirmed) {
						swal.disableButtons();
						if (confirmed) {
							const action = value ? 'archiveRoom' : 'unarchiveRoom';
							return resolve(call(action, room._id).then(() => {
								swal({
									title: value ? t('Room_archived') : t('Room_has_been_archived'),
									text: value ? t('Room_has_been_archived') : t('Room_has_been_unarchived'),
									type: 'success',
									timer: 2000,
									showConfirmButton: false
								});
								return RocketChat.callbacks.run(action, room);
							}, () => swal.enableButtons()));
						}
						return reject();
					});

				});
			}
		},
		joinCode: {
			type: 'text',
			label: 'Password',
			showingValue: new ReactiveVar(false),
			realValue: null,
			canView:() => {
				return this.setting.t.value && this.setting.t.value.get() === 'c' && RocketChat.authz.hasAllPermission('edit-room', room._id);
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
		const def =setting.getValue ? setting.getValue(this.room): this.room[key];
		setting.default = new ReactiveVar(def || false);
		setting.value = new ReactiveVar(def || false);
	});
});

Template.channelSettingsEditing.helpers({
	...can,
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
		const {settings} = Template.instance();
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
			default :
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
		let warnText;
		const { rid, name, t : type } = instance.room;
		switch (type) {
			case 'c': warnText = 'Leave_Room_Warning'; break;
			case 'p': warnText = 'Leave_Group_Warning'; break;
			case 'd': warnText = 'Leave_Private_Warning'; break;
			case 'l': warnText = 'Leave_Livechat_Warning'; break;
		}

		swal({
			title: t('Are_you_sure'),
			text: warnText ? t(warnText, name) : '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_leave_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, async function() {
			if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
				FlowRouter.go('home');
			}

			await call('leaveRoom', rid);

			if (rid === Session.get('openedRoom')) {
				Session.delete('openedRoom');
			}

		});
	},
	'click .js-hide'(e, instance) {
		let warnText;
		const { rid, name, t: type } = instance.room;
		switch (type) {
			case 'c': warnText = 'Hide_Room_Warning'; break;
			case 'p': warnText = 'Hide_Group_Warning'; break;
			case 'd': warnText = 'Hide_Private_Warning'; break;
			case 'l': warnText = 'Hide_Livechat_Warning'; break;
		}

		swal({
			title: t('Are_you_sure'),
			text: warnText ? t(warnText, name) : '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_hide_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, async function() {
			if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
				FlowRouter.go('home');
			}

			await call('hideRoom', rid);

			if (rid === Session.get('openedRoom')) {
				Session.delete('openedRoom');
			}

		});
	},
	'click .js-cancel'(e, t) {
		t.editing.set(false);
	},
	'click .js-delete'() {
		return swal({
			title: t('Are_you_sure'),
			text: t('Delete_Room_Warning'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_delete_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			swal.disableButtons();
			call('eraseRoom', this.rid).then(() => {
				swal({
					title: t('Deleted'),
					text: t('Room_has_been_deleted'),
					type: 'success',
					timer: 2000,
					showConfirmButton: false
				});
			}, () => swal.enableButtons());
		});
	}
});

Template.channelSettingsInfo.onCreated(function() {
	this.room = ChatRoom.findOne(this.data && this.data.rid);
});

Template.channelSettingsInfo.helpers({
	archived() {
		return Template.instance().room.archived;
	},
	unscape(value) {
		return s.unescapeHTML(value);
	},
	channelSettings() {
		return RocketChat.ChannelSettings.getOptions(Template.currentData(), 'room');
	},
	...can,
	name() {
		return Template.instance().room.name;
	},
	description() {
		return Template.instance().room.description;
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
			default :
				return null;
		}
	}
});
