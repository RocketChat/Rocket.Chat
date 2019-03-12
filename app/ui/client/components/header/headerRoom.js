import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { t, roomTypes, handleError } from 'meteor/rocketchat:utils';
import { TabBar, fireGlobalEvent } from 'meteor/rocketchat:ui-utils';
import { ChatSubscription, Rooms, ChatRoom } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { emoji } from 'meteor/rocketchat:emoji';
import { Markdown } from 'meteor/rocketchat:markdown';

const isSubscribed = (_id) => ChatSubscription.find({ rid: _id }).count() > 0;

const favoritesEnabled = () => settings.get('Favorite_Rooms');

const isThread = ({ _id }) => {
	const room = ChatRoom.findOne({ _id });
	return !!(room && room.prid);
};


Template.headerRoom.helpers({
	back() {
		return Template.instance().data.back;
	},
	avatarBackground() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomTypes.getSecondaryRoomName(roomData.t, roomData) || roomTypes.getRoomName(roomData.t, roomData);
	},
	buttons() {
		return TabBar.getButtons();
	},

	isThread() {
		return isThread(Template.instance().data);
	},

	isTranslated() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
		return settings.get('AutoTranslate_Enabled') && ((sub != null ? sub.autoTranslate : undefined) === true) && (sub.autoTranslateLanguage != null);
	},

	state() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { f: 1 } });
		if (((sub != null ? sub.f : undefined) != null) && sub.f && favoritesEnabled()) { return ' favorite-room'; }
		return 'empty';
	},

	favoriteLabel() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { f: 1 } });
		if (((sub != null ? sub.f : undefined) != null) && sub.f && favoritesEnabled()) { return 'Unfavorite'; }
		return 'Favorite';
	},

	isDirect() {
		return Rooms.findOne(this._id).t === 'd';
	},

	roomName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return roomTypes.getRoomName(roomData.t, roomData);
	},

	secondaryName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return roomTypes.getSecondaryRoomName(roomData.t, roomData);
	},

	roomTopic() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData || !roomData.topic) { return ''; }

		let roomTopic = Markdown.parse(roomData.topic);

		// &#39; to apostrophe (') for emojis such as :')
		roomTopic = roomTopic.replace(/&#39;/g, '\'');

		Object.keys(emoji.packages).forEach((emojiPackage) => {
			roomTopic = emoji.packages[emojiPackage].render(roomTopic);
		});

		// apostrophe (') back to &#39;
		roomTopic = roomTopic.replace(/\'/g, '&#39;');

		return roomTopic;
	},

	roomIcon() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!(roomData != null ? roomData.t : undefined)) { return ''; }

		return roomTypes.getIcon(roomData);
	},

	tokenAccessChannel() {
		return Template.instance().hasTokenpass.get();
	},

	encryptedChannel() {
		const roomData = Session.get(`roomData${ this._id }`);
		return roomData && roomData.encrypted;
	},

	userStatus() {
		const roomData = Session.get(`roomData${ this._id }`);
		return roomTypes.getUserStatus(roomData.t, this._id) || t('offline');
	},

	showToggleFavorite() {
		return !isThread(Template.instance().data) && isSubscribed(this._id) && favoritesEnabled();
	},

	fixedHeight() {
		return Template.instance().data.fixedHeight;
	},

	fullpage() {
		return Template.instance().data.fullpage;
	},

	isChannel() {
		return Template.instance().currentChannel != null;
	},

	isSection() {
		return Template.instance().data.sectionName != null;
	},
});

Template.headerRoom.events({
	'click .iframe-toolbar .js-iframe-action'(e) {
		fireGlobalEvent('click-toolbar-button', { id: this.id });
		e.currentTarget.querySelector('button').blur();
		return false;
	},

	'click .rc-header__toggle-favorite'(event) {
		event.stopPropagation();
		event.preventDefault();
		return Meteor.call(
			'toggleFavorite',
			this._id,
			!$(event.currentTarget).hasClass('favorite-room'),
			(err) => err && handleError(err)
		);
	},

	'click .edit-room-title'(event) {
		event.preventDefault();
		Session.set('editRoomTitle', true);
		$('.rc-header').addClass('visible');
		return Meteor.setTimeout(() =>
			$('#room-title-field')
				.focus()
				.select(),
		10);
	},

	'click .js-open-parent-channel'(event, t) {
		event.preventDefault();
		const { prid } = t.currentChannel;
		FlowRouter.goToRoomById(prid);
	},
});

Template.headerRoom.onCreated(function() {
	this.currentChannel = (this.data && this.data._id && Rooms.findOne(this.data._id)) || undefined;

	this.hasTokenpass = new ReactiveVar(false);

	if (settings.get('API_Tokenpass_URL') !== '') {
		Meteor.call('getChannelTokenpass', this.data._id, (error, result) => {
			if (!error) {
				this.hasTokenpass.set(!!(result && result.tokens && result.tokens.length > 0));
			}
		});
	}
});
