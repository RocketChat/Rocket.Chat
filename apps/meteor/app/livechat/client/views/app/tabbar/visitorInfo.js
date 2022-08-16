import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import moment from 'moment';
import UAParser from 'ua-parser-js';

import { modal } from '../../../../../ui-utils';
import { Subscriptions } from '../../../../../models/client';
import { settings } from '../../../../../settings';
import { t } from '../../../../../utils';
import { hasRole, hasPermission, hasAtLeastOnePermission } from '../../../../../authorization';
import { APIClient } from '../../../../../utils/client';
import { RoomManager } from '../../../../../ui-utils/client';
import { getCustomFormTemplate } from '../customTemplates/register';
import { Markdown } from '../../../../../markdown/client';
import { formatDateAndTime } from '../../../../../../client/lib/utils/formatDateAndTime';
import { roomCoordinator } from '../../../../../../client/lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';
import './visitorInfo.html';

const isSubscribedToRoom = () => {
	const data = Template.currentData();
	if (!data || !data.rid) {
		return false;
	}

	const subscription = Subscriptions.findOne({ rid: data.rid });
	return subscription !== undefined;
};

const closingDialogRequired = (department) => {
	if (settings.get('Livechat_request_comment_when_closing_conversation')) {
		return true;
	}

	return department && department.requestTagBeforeClosingChat;
};

Template.visitorInfo.helpers({
	user() {
		const user = Template.instance().user.get();
		if (user && user.userAgent) {
			const ua = new UAParser();
			ua.setUA(user.userAgent);

			user.os = `${ua.getOS().name} ${ua.getOS().version}`;
			if (['Mac OS', 'iOS'].indexOf(ua.getOS().name) !== -1) {
				user.osIcon = 'icon-apple';
			} else {
				user.osIcon = `icon-${ua.getOS().name.toLowerCase()}`;
			}
			user.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
			user.browserIcon = `icon-${ua.getBrowser().name.toLowerCase()}`;

			user.status = roomCoordinator.getRoomDirectives('l')?.getUserStatus(this.rid) || 'offline';
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

	customRoomFields() {
		const customFields = Template.instance().customFields.get();
		if (!customFields || customFields.length === 0) {
			return [];
		}

		const fields = [];
		const room = Template.instance().room.get();
		const { livechatData = {} } = room || {};

		Object.keys(livechatData).forEach((key) => {
			const field = _.findWhere(customFields, { _id: key });
			if (field && field.visibility !== 'hidden' && field.scope === 'room') {
				fields.push({ label: field.label, value: livechatData[key] });
			}
		});

		return fields;
	},

	customVisitorFields() {
		const customFields = Template.instance().customFields.get();
		if (!hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields'])) {
			return;
		}
		if (!customFields || customFields.length === 0) {
			return [];
		}

		const fields = [];
		const user = Template.instance().user.get();
		const { livechatData = {} } = user || {};

		Object.keys(livechatData).forEach((key) => {
			const field = _.findWhere(customFields, { _id: key });
			if (field && field.visibility !== 'hidden' && field.scope === 'visitor') {
				fields.push({ label: field.label, value: livechatData[key] });
			}
		});

		return fields;
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

	sendingTranscript() {
		return Template.instance().action.get() === 'transcript';
	},

	roomInfoData() {
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
		if (hasPermission('save-others-livechat-room-info')) {
			return true;
		}

		return isSubscribedToRoom();
	},

	canCloseRoom() {
		if (hasPermission('close-others-livechat-room')) {
			return true;
		}

		return isSubscribedToRoom();
	},

	canForwardGuest() {
		return hasPermission('transfer-livechat-guest');
	},

	canSendTranscript() {
		const room = Template.instance().room.get();
		return !room.email && hasPermission('send-omnichannel-chat-transcript');
	},

	canPlaceChatOnHold() {
		const room = Template.instance().room.get();
		return (
			room.open &&
			!room.onHold &&
			room.servedBy &&
			room.lastMessage &&
			!room.lastMessage?.token &&
			settings.get('Livechat_allow_manual_on_hold')
		);
	},

	roomClosedDateTime() {
		const { closedAt } = this;
		return formatDateAndTime(closedAt);
	},

	roomClosedBy() {
		const { closedBy = {}, servedBy = {} } = this;
		let { closer } = this;

		if (closer === 'user') {
			if (servedBy._id !== closedBy._id) {
				return closedBy.username;
			}

			closer = 'agent';
		}

		const closerLabel = closer.charAt(0).toUpperCase() + closer.slice(1);
		return t(`${closerLabel}`);
	},

	customInfoTemplate() {
		return getCustomFormTemplate('livechatVisitorInfo');
	},

	roomDataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return Template.instance().room;
	},

	transcriptRequest() {
		const room = Template.instance().room.get();
		return room?.transcriptRequest;
	},

	transcriptRequestedDateTime() {
		const { requestedAt } = this;
		return formatDateAndTime(requestedAt);
	},

	markdown(text) {
		return Markdown.parse(text);
	},
});

Template.visitorInfo.events({
	'click .edit-livechat'(event, instance) {
		event.preventDefault();

		instance.action.set('edit');
	},
	'click .close-livechat'(event, instance) {
		event.preventDefault();

		if (!closingDialogRequired(instance.department.get())) {
			const comment = TAPi18n.__('Chat_closed_by_agent');
			return Meteor.call('livechat:closeRoom', this.rid, comment, { clientAction: true }, function (error /* , result*/) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}

				modal.open({
					title: t('Chat_closed'),
					text: t('Chat_closed_successfully'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		}

		modal.open({
			title: t('Closing_chat'),
			modifier: 'modal',
			content: 'closeRoom',
			data: {
				rid: this.rid,
			},
			confirmOnEnter: false,
			showConfirmButton: false,
			showCancelButton: false,
		});
	},

	'click .return-inquiry'(event) {
		event.preventDefault();

		modal.open(
			{
				title: t('Would_you_like_to_return_the_inquiry'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: t('Yes'),
			},
			() => {
				Meteor.call('livechat:returnAsInquiry', this.rid, function (error /* , result*/) {
					if (error) {
						dispatchToastMessage({ type: 'error', message: error });
					} else {
						Session.set('openedRoom');
						FlowRouter.go('/home');
					}
				});
			},
		);
	},

	'click .forward-livechat'(event, instance) {
		event.preventDefault();

		instance.action.set('forward');
	},

	'click .send-transcript'(event, instance) {
		event.preventDefault();

		instance.action.set('transcript');
	},

	'click .on-hold'(event) {
		event.preventDefault();

		modal.open(
			{
				title: t('Would_you_like_to_place_chat_on_hold'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: t('Yes'),
			},
			async () => {
				const { success } = await APIClient.post('/v1/livechat/room.onHold', { roomId: this.rid });
				if (success) {
					modal.open({
						title: t('Chat_On_Hold'),
						text: t('Chat_On_Hold_Successfully'),
						type: 'success',
						timer: 1500,
						showConfirmButton: false,
					});
				}
			},
		);
	},
});

Template.visitorInfo.onCreated(function () {
	this.visitorId = new ReactiveVar(null);
	this.customFields = new ReactiveVar([]);
	this.action = new ReactiveVar();
	this.user = new ReactiveVar();
	this.departmentId = new ReactiveVar(null);
	this.tags = new ReactiveVar(null);
	this.routingConfig = new ReactiveVar({});
	this.department = new ReactiveVar({});
	this.room = new ReactiveVar({});

	this.updateVisitor = async (visitorId) => {
		const { visitor } = await APIClient.get('/v1/livechat/visitors.info', { visitorId });
		this.user.set(visitor);
	};

	this.updateRoom = (room) => {
		this.departmentId.set(room && room.departmentId);
		this.tags.set(room && room.tags);
		this.room.set(room);
		const visitorId = room && room.v && room.v._id;
		this.visitorId.set(visitorId);
		this.updateVisitor(visitorId);
	};

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
		const { room } = await APIClient.get('/v1/rooms.info', { roomId: rid });
		this.updateRoom(room);
	};

	if (rid) {
		RoomManager.roomStream.on(rid, this.updateRoom);
		loadRoomData(rid);
	}

	this.autorun(async () => {
		if (this.departmentId.get()) {
			const { department } = await APIClient.get(`/v1/livechat/department/${this.departmentId.get()}`, { includeAgents: false });
			this.department.set(department);
		}
	});

	this.autorun(() => {
		const visitorId = this.visitorId.get();
		if (visitorId) {
			this.updateVisitor(visitorId);
		}
	});
});

Template.visitorInfo.onDestroyed(function () {
	const { rid } = Template.currentData();
	RoomManager.roomStream.removeListener(rid, this.updateRoom);
});
