import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import UAParser from 'ua-parser-js';

import { modal } from '../../../../../ui-utils';
import { Rooms, Subscriptions } from '../../../../../models';
import { settings } from '../../../../../settings';
import { t, handleError, roomTypes } from '../../../../../utils';
import { hasAllPermission, hasAtLeastOnePermission } from '../../../../../authorization';
import { LivechatVisitor } from '../../../collections/LivechatVisitor';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';
import { LivechatRoom } from '../../../collections/LivechatRoom';
import './visitorInfo.html';

const isSubscribedToRoom = () => {
	const data = Template.currentData();
	if (!data || !data.rid) {
		return false;
	}

	const subscription = Subscriptions.findOne({ rid: data.rid });
	return subscription !== undefined;
};

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

			user.status = roomTypes.getUserStatus('l', this.rid) || 'offline';
		}
		return user;
	},

	room() {
		return Template.instance().room.get();
	},

	department() {
		return LivechatDepartment.findOne({ _id: Template.instance().departmentId.get() });
	},

	joinTags() {
		const tags = Template.instance().tags.get();
		return tags && tags.join(', ');
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
			const room = Rooms.findOne(data.rid);
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
			},
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
			},
		};
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open;
	},

	guestPool() {
		return settings.get('Livechat_Routing_Method') === 'Guest_Pool';
	},

	showDetail() {
		if (Template.instance().action.get()) {
			return 'hidden';
		}
	},

	isSubscribedToRoom() {
		return isSubscribedToRoom();
	},

	canSeeButtons() {
		if (hasAtLeastOnePermission(['close-others-livechat-room', 'transfer-livechat-guest'])) {
			return true;
		}

		return isSubscribedToRoom();
	},

	canEditRoom() {
		if (hasAllPermission('save-others-livechat-room-info')) {
			return true;
		}

		return isSubscribedToRoom();
	},

	canCloseRoom() {
		if (hasAllPermission('close-others-livechat-room')) {
			return true;
		}

		return isSubscribedToRoom();
	},

	canForwardGuest() {
		if (hasAllPermission('transfer-livechat-guest')) {
			return true;
		}

		return isSubscribedToRoom();
	},
});

Template.visitorInfo.events({
	'click .edit-livechat'(event, instance) {
		event.preventDefault();

		instance.action.set('edit');
	},
	'click .close-livechat'(event) {
		event.preventDefault();

		const closeRoom = (comment) => Meteor.call('livechat:closeRoom', this.rid, comment, function(error/* , result*/) {
			if (error) {
				return handleError(error);
			}
			modal.open({
				title: t('Chat_closed'),
				text: t('Chat_closed_successfully'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false,
			});
		});

		if (!settings.get('Livechat_request_comment_when_closing_conversation')) {
			const comment = TAPi18n.__('Chat_closed_by_agent');
			return closeRoom(comment);
		}

		// Setting for Ask_for_conversation_finished_message is set to true
		modal.open({
			title: t('Closing_chat'),
			type: 'input',
			inputPlaceholder: t('Please_add_a_comment'),
			showCancelButton: true,
			closeOnConfirm: false,
		}, (inputValue) => {
			if (!inputValue) {
				modal.showInputError(t('Please_add_a_comment_to_close_the_room'));
				return false;
			}

			if (s.trim(inputValue) === '') {
				modal.showInputError(t('Please_add_a_comment_to_close_the_room'));
				return false;
			}

			return closeRoom(inputValue);
		});
	},

	'click .return-inquiry'(event) {
		event.preventDefault();

		modal.open({
			title: t('Would_you_like_to_return_the_inquiry'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: t('Yes'),
		}, () => {
			Meteor.call('livechat:returnAsInquiry', this.rid, function(error/* , result*/) {
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
	},
});

Template.visitorInfo.onCreated(function() {
	this.visitorId = new ReactiveVar(null);
	this.customFields = new ReactiveVar([]);
	this.action = new ReactiveVar();
	this.user = new ReactiveVar();
	this.departmentId = new ReactiveVar(null);
	this.tags = new ReactiveVar(null);
	this.room = new ReactiveVar(null);

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	const { rid } = Template.currentData();

	if (rid) {
		this.autorun(() => {
			const room = LivechatRoom.findOne({ _id: rid });
			this.room.set(room);
			this.visitorId.set(room && room.v && room.v._id);
			this.departmentId.set(room && room.departmentId);
			this.tags.set(room && room.tags);
		});

		this.subscribe('livechat:visitorInfo', { rid });
		this.subscribe('livechat:departments', { _id: this.departmentId.get() });
		this.subscribe('livechat:rooms', { _id: rid });
	}

	this.autorun(() => {
		this.user.set(LivechatVisitor.findOne({ _id: this.visitorId.get() }));
	});
});
