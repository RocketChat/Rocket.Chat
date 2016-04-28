Template.visitorInfo.helpers({
	user() {
		const user = Template.instance().user.get();
		if (user && user.userAgent) {
			var ua = new UAParser();
			ua.setUA(user.userAgent);

			user.os = ua.getOS().name + ' ' + ua.getOS().version;
			if (['Mac OS', 'iOS'].indexOf(ua.getOS().name) !== -1) {
				user.osIcon = 'icon-apple';
			} else {
				user.osIcon = 'icon-' + ua.getOS().name.toLowerCase();
			}
			user.browser = ua.getBrowser().name + ' ' + ua.getBrowser().version;
			user.browserIcon = 'icon-' + ua.getBrowser().name.toLowerCase();
		}

		return user;
	},

	room() {
		return ChatRoom.findOne({ _id: this.rid });
	},

	joinTags() {
		return this.tags.join(', ');
	},

	customFields() {
		let fields = [];
		let livechatData = {};
		const user = Template.instance().user.get();
		if (user) {
			livechatData = _.extend(livechatData, user.livechatData);
		}

		let data = Template.currentData();
		if (data && data.rid) {
			let room = RocketChat.models.Rooms.findOne(data.rid);
			if (room) {
				livechatData = _.extend(livechatData, room.livechatData);
			}
		}

		if (!_.isEmpty(livechatData)) {
			for (let _id in livechatData) {
				if (livechatData.hasOwnProperty(_id)) {
					let customFields = Template.instance().customFields.get();
					if (customFields) {
						let field = _.findWhere(customFields, { _id: _id });
						if (field && field.visibility !== 'hidden') {
							fields.push({ label: field.label, value: livechatData[_id] });
						}
					}
				}
			}
			return fields;
		}
	},

	createdAt() {
		if (!this.createdAt) {
			return '';
		}
		return moment(this.createdAt).format('L LTS');
	},

	lastLogin() {
		if (!this.lastLogin) {
			return '';
		}
		return moment(this.lastLogin).format('L LTS');
	},

	editing() {
		return Template.instance().editing.get();
	},

	editDetails() {
		const instance = Template.instance();
		const user = instance.user.get();
		return {
			visitorId: user ? user._id : null,
			roomId: this.rid,
			save() {
				instance.editing.set(false);
			},
			cancel() {
				instance.editing.set(false);
			}
		};
	}
});

Template.visitorInfo.events({
	'click .edit-livechat'(event, instance) {
		event.preventDefault();

		instance.editing.set(true);
	},
	'click .close-livechat'(event) {
		event.preventDefault();

		swal({
			title: t('Closing_chat'),
			type: 'input',
			inputPlaceholder: t('Please_add_a_comment'),
			showCancelButton: true,
			// confirmButtonColor: '#DD6B55',
			// confirmButtonText: t('Yes'),
			// cancelButtonText: t('Cancel'),
			closeOnConfirm: false
		}, () => {
			swal({
				title: t('Chat_closed'),
				text: t('Chat_closed_successfully'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false
			});
			// Meteor.call('livechat:removeDepartment', this._id, function(error/*, result*/) {
			// 	if (error) {
			// 		return handleError(error);
			// 	}
			// 	swal({
			// 		title: t('Removed'),
			// 		text: t('Department_removed'),
			// 		type: 'success',
			// 		timer: 1000,
			// 		showConfirmButton: false
			// 	});
			// });
		});
	}
});

Template.visitorInfo.onCreated(function() {
	this.visitorToken = new ReactiveVar(null);
	this.customFields = new ReactiveVar([]);
	this.editing = new ReactiveVar(false);
	this.user = new ReactiveVar();

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	var currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.autorun(() => {
			var room = ChatRoom.findOne(currentData.rid);
			if (room && room.v && room.v.token) {
				this.visitorToken.set(room.v.token);
			} else {
				this.visitorToken.set();
			}
		});

		this.subscribe('livechat:visitorInfo', currentData.rid);
	}

	this.autorun(() => {
		this.user.set(Meteor.users.findOne({ 'profile.token': this.visitorToken.get() }));
	});
});
