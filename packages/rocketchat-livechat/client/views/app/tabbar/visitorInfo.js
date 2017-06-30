import moment from 'moment';
import UAParser from 'ua-parser-js';

Template.visitorInfo.helpers({
	user() {
		const user = Template.instance().user.get();
		if (user && user.userAgent) {
			const ua = new UAParser();
			ua.setUA(user.userAgent);

			user.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
			if (['Mac OS', 'iOS'].indexOf(ua.getOS().name) !== -1) {
				user.osIcon = 'icon-apple';
			} else {
				user.osIcon = `icon-${ ua.getOS().name.toLowerCase() }`;
			}
			user.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;
			user.browserIcon = `icon-${ ua.getBrowser().name.toLowerCase() }`;
		}

		return user;
	},

	room() {
		return ChatRoom.findOne({ _id: this.rid });
	},

	joinTags() {
		return this.tags && this.tags.join(', ');
	},

	customFields() {
		const fields = [];
		let livechatData = {};
		const user = Template.instance().user.get();
		if (user) {
			livechatData = _.extend(livechatData, user.livechatData);
		}

		const data = Template.currentData();
		if (data && data.rid) {
			const room = RocketChat.models.Rooms.findOne(data.rid);
			if (room) {
				livechatData = _.extend(livechatData, room.livechatData);
			}
		}

		if (!_.isEmpty(livechatData)) {
			for (const _id in livechatData) {
				if (livechatData.hasOwnProperty(_id)) {
					const customFields = Template.instance().customFields.get();
					if (customFields) {
						const field = _.findWhere(customFields, { _id });
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
		return Template.instance().action.get() === 'edit';
	},

	forwarding() {
		return Template.instance().action.get() === 'forward';
	},

	editDetails() {
		const instance = Template.instance();
		const user = instance.user.get();
		return {
			visitorId: user ? user._id : null,
			roomId: this.rid,
			save() {
				instance.action.set();
			},
			cancel() {
				instance.action.set();
			}
		};
	},

	forwardDetails() {
		const instance = Template.instance();
		const user = instance.user.get();
		return {
			visitorId: user ? user._id : null,
			roomId: this.rid,
			save() {
				instance.action.set();
			},
			cancel() {
				instance.action.set();
			}
		};
	},

	roomOpen() {
		const room = ChatRoom.findOne({ _id: this.rid });

		return room.open;
	},

	guestPool() {
		return RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool';
	},

	showDetail() {
		if (Template.instance().action.get()) {
			return 'hidden';
		}
	},

	canSeeButtons() {
		if (RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
			return true;
		}

		const data = Template.currentData();
		if (data && data.rid) {
			const subscription = RocketChat.models.Subscriptions.findOne({ rid: data.rid });
			return subscription !== undefined;
		}
		return false;
	}
});

Template.visitorInfo.events({
	'click .edit-livechat'(event, instance) {
		event.preventDefault();

		instance.action.set('edit');
	},
	'click .close-livechat'(event) {
		event.preventDefault();

		swal({
			title: t('Closing_chat'),
			type: 'input',
			inputPlaceholder: t('Please_add_a_comment'),
			showCancelButton: true,
			closeOnConfirm: false
		}, (inputValue) => {
			if (!inputValue) {
				swal.showInputError(t('Please_add_a_comment_to_close_the_room'));
				return false;
			}

			if (s.trim(inputValue) === '') {
				swal.showInputError(t('Please_add_a_comment_to_close_the_room'));
				return false;
			}

			Meteor.call('livechat:closeRoom', this.rid, inputValue, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				swal({
					title: t('Chat_closed'),
					text: t('Chat_closed_successfully'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},

	'click .return-inquiry'(event) {
		event.preventDefault();

		swal({
			title: t('Would_you_like_to_return_the_inquiry'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: t('Yes')
		}, () => {
			Meteor.call('livechat:returnAsInquiry', this.rid, function(error/*, result*/) {
				if (error) {
					console.log(error);
				} else {
					Session.set('openedRoom');
					FlowRouter.go('/home');
				}
			});
		});
	},

	'click .forward-livechat'(event, instance) {
		event.preventDefault();

		instance.action.set('forward');
	}
});

Template.visitorInfo.onCreated(function() {
	this.visitorId = new ReactiveVar(null);
	this.customFields = new ReactiveVar([]);
	this.action = new ReactiveVar();
	this.user = new ReactiveVar();

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	const currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.autorun(() => {
			const room = ChatRoom.findOne(currentData.rid);
			if (room && room.v && room.v._id) {
				this.visitorId.set(room.v._id);
			} else {
				this.visitorId.set();
			}
		});

		this.subscribe('livechat:visitorInfo', { rid: currentData.rid });
	}

	this.autorun(() => {
		this.user.set(Meteor.users.findOne({ '_id': this.visitorId.get() }));
	});
});
