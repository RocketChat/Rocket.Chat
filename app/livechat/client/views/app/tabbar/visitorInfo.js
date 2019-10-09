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
import { Subscriptions } from '../../../../../models';
import { settings } from '../../../../../settings';
import { t, handleError, roomTypes } from '../../../../../utils';
import { hasRole, hasAllPermission, hasAtLeastOnePermission } from '../../../../../authorization';
import { LivechatVisitor } from '../../../collections/LivechatVisitor';
import './visitorInfo.html';
import { APIClient } from '../../../../../utils/client';

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
		return Template.instance().department.get();
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
			const room = Template.instance().room.get();
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
		const uid = Meteor.userId();
		return room && room.open && ((room.servedBy && room.servedBy._id === uid) || hasRole(uid, 'livechat-manager'));
	},

	canReturnQueue() {
		const config = Template.instance().routingConfig.get();
		return config.returnQueue;
	},

	showDetail() {
		if (Template.instance().action.get()) {
			return 'hidden';
		}
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
					handleError(error);
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
	this.routingConfig = new ReactiveVar({});
	this.department = new ReactiveVar({});
	this.room = new ReactiveVar({});

	Meteor.call('livechat:getCustomFields', (err, customFields) => {
		if (customFields) {
			this.customFields.set(customFields);
		}
	});

	const { rid } = Template.currentData();
	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});

	const loadRoomData = async (rid) => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ rid }`);
		this.visitorId.set(room && room.v && room.v._id);
		this.departmentId.set(room && room.departmentId);
		this.tags.set(room && room.tags);
		this.room.set(room);
	};

	if (rid) {
		this.autorun(async () => {
			const action = this.action.get();
			if (action === undefined) {
				await loadRoomData(rid);
			}
		});

		this.subscribe('livechat:visitorInfo', { rid });
	}

	this.autorun(async () => {
		if (this.departmentId.get()) {
			const { department } = await APIClient.v1.get(`livechat/department/${ this.departmentId.get() }?includeAgents=false`);
			this.department.set(department);
		}
	});

	this.autorun(() => {
		this.user.set(LivechatVisitor.findOne({ _id: this.visitorId.get() }));
	});
});
