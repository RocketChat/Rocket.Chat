import { DateFormat } from '../../../lib';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { roomTypes } from '../../../utils';
import { Subscriptions } from '../../../models';

Template.ChatpalSearchResultTemplate.onCreated(function() {
	this.badRequest = new ReactiveVar(false);
	this.resultType = new ReactiveVar(this.data.settings.DefaultResultType);
	this.data.parentPayload.resultType = this.resultType.get();
});

Template.ChatpalSearchResultTemplate.events = {
	'click .chatpal-search-typefilter li'(evt, t) {
		t.data.parentPayload.resultType = evt.currentTarget.getAttribute('value');
		t.data.payload.start = 0;
		t.resultType.set(t.data.parentPayload.resultType);
		t.data.search();
	},
	'click .chatpal-paging-prev'(env, t) {
		t.data.payload.start -= t.data.settings.PageSize;
		t.data.search();
	},
	'click .chatpal-paging-next'(env, t) {
		t.data.payload.start = (t.data.payload.start || 0) + t.data.settings.PageSize;
		t.data.search();
	},
	'click .chatpal-show-more.more-messages'(evt, t) {
		t.data.parentPayload.resultType = 'Messages';
		t.data.payload.start = 0;
		t.data.payload.rows = t.data.settings.PageSize;
		t.resultType.set(t.data.parentPayload.resultType);
		t.data.search();
	},
	'click .chatpal-show-more.more-files'(evt, t) {
		t.data.parentPayload.resultType = 'Files';
		t.data.payload.start = 0;
		t.data.payload.rows = t.data.settings.PageSize;
		t.resultType.set(t.data.parentPayload.resultType);
		t.data.search();
	},
};

Template.ChatpalSearchResultTemplate.helpers({
	result() {
		return Template.instance().data.result.get();
	},
	searching() {
		return Template.instance().data.searching.get();
	},
	resultType() {
		return Template.instance().resultType.get();
	},
	navSelected(type) {
		return Template.instance().resultType.get() === type ? 'selected' : '';
	},
	resultsFoundForAllSearch() {
		const result = Template.instance().data.result.get();

		if (!result) { return true; }

		return result.message.numFound > 0 || result.user.numFound > 0 || result.room.numFound > 0 || result.file.numFound > 0;
	},
	moreThanDisplayed(type) {
		const result = Template.instance().data.result.get();

		return result[type].docs.length < result[type].numFound;
	},
	resultNumFound() {
		const type = Template.instance().resultType.get() === 'Files' ? 'file' : 'message';
		const result = Template.instance().data.result.get();
		if (result) {
			switch (result[type].numFound) {
				case 0:
					return TAPi18n.__('Chatpal_no_search_results');
				case 1:
					return TAPi18n.__('Chatpal_one_search_result');
				default:
					return TAPi18n.__('Chatpal_search_results', result[type].numFound);
			}
		}
	},
	resultPaging() {
		const type = Template.instance().resultType.get() === 'Files' ? 'file' : 'message';
		const result = Template.instance().data.result.get();
		const pageSize = Template.instance().data.settings.PageSize;
		if (result) {
			return {
				currentPage: 1 + result[type].start / pageSize,
				numOfPages: Math.ceil(result[type].numFound / pageSize),
			};
		}
	},
});

Template.ChatpalSearchSingleMessage.helpers({
	roomIcon() {
		const room = Session.get(`roomData${ this.rid }`);
		if (room && room.t === 'd') {
			return 'at';
		}
		return roomTypes.getIcon(room);
	},

	roomLink() {
		const subscription = Subscriptions.findOne({ rid: this.rid });
		return roomTypes.getRouteLink(subscription.t, subscription);
	},

	roomName() {
		const room = Session.get(`roomData${ this.rid }`);
		return roomTypes.getRoomName(room.t, room);
	},

	time() {
		return DateFormat.formatTime(this.created);
	},
	date() {
		return DateFormat.formatDate(this.created);
	},
});

Template.ChatpalSearchSingleFile.helpers({
	roomIcon() {
		const room = Session.get(`roomData${ this.rid }`);
		if (room && room.t === 'd') {
			return 'at';
		}
		return roomTypes.getIcon(room);
	},

	roomLink() {
		const subscription = Subscriptions.findOne({ rid: this.rid });
		return roomTypes.getRouteLink(subscription.t, subscription);
	},

	roomName() {
		const room = Session.get(`roomData${ this.rid }`);
		return roomTypes.getRoomName(room.t, room);
	},

	sizes: {
		b: 1,
		kb: 1024,
		mb: Math.pow(1024, 2),
		gb: Math.pow(1024, 3),
	},

	fileSize() {
		const bytes = this.file_size;
		const sizes = Template.ChatpalSearchSingleFile.__helpers.get('sizes');
		let unit = 'b';
		if (bytes >= sizes.gb) {
			unit = 'gb';
		} else if (bytes >= sizes.mb) {
			unit = 'mb';
		} else if (bytes >= sizes.kb) {
			unit = 'kb';
		}

		return `${ parseFloat((bytes / sizes[unit]).toFixed(2)) } ${ unit.toUpperCase() }`;
	},

	time() {
		return DateFormat.formatTime(this.updated);
	},
	date() {
		return DateFormat.formatDate(this.updated);
	},
});

Template.ChatpalSearchSingleRoom.helpers({
	roomIcon() {
		const room = Session.get(`roomData${ this._id }`);
		if (room && room.t === 'd') {
			return 'at';
		}
		return roomTypes.getIcon(room);
	},
	roomLink() {
		const subscription = Subscriptions.findOne({ rid: this._id });
		return roomTypes.getRouteLink(subscription.t, subscription);
	},
});

Template.ChatpalSearchSingleUser.helpers({
	cleanUsername() {
		return (this.user_username instanceof Array ? this.user_username[0] : this.user_username).replace(/<\/?em>/ig, '');
	},
	nameMatchingUsername() {
		const uname = this.user_username instanceof Array ? this.user_username[0] : this.user_username;
		const name = this.user_name instanceof Array ? this.user_name[0] : this.user_name;
		return uname === name;
	},
});
