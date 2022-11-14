import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { MessageAction, RoomHistoryManager } from '../../../ui-utils';
import { messageArgs } from '../../../../client/lib/utils/messageArgs';
import { Rooms } from '../../../models/client';
import { getCommonRoomEvents } from '../../../ui/client/views/app/lib/getCommonRoomEvents';
import { goToRoomById } from '../../../../client/lib/utils/goToRoomById';

Meteor.startup(function () {
	MessageAction.addButton({
		id: 'jump-to-search-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['search'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			if (message.tmid) {
				return FlowRouter.go(
					FlowRouter.getRouteName(),
					{
						tab: 'thread',
						context: message.tmid,
						rid: message.rid,
						name: Rooms.findOne({ _id: message.rid }).name,
					},
					{
						jump: message._id,
					},
				);
			}

			if (Session.get('openedRoom') === message.rid) {
				return RoomHistoryManager.getSurroundingMessages(message);
			}

			goToRoomById(message.rid);
			// RocketChat.MessageAction.hideDropDown();

			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}

			window.setTimeout(() => {
				RoomHistoryManager.getSurroundingMessages(message);
			}, 400);
			// 400ms is popular among game devs as a good delay before transition starts
			// ie. 50, 100, 200, 400, 800 are the favored timings
		},
		order: 100,
		group: 'menu',
	});
});

Template.DefaultSearchResultTemplate.onRendered(function () {
	const list = this.firstNode.parentNode.querySelector('.rocket-default-search-results');
	this.autorun(() => {
		const result = this.data.result.get();
		if (result && this.hasMore.get()) {
			Tracker.afterFlush(() => {
				if (list.scrollHeight < list.offsetHeight) {
					this.data.payload.limit = (this.data.payload.limit || this.pageSize) + this.pageSize;
					this.data.search();
				}
			});
		}
	});
});

Template.DefaultSearchResultTemplate.onCreated(function () {
	// paging
	this.pageSize = this.data.settings.PageSize;

	// global search
	this.globalSearchEnabled = this.data.settings.GlobalSearchEnabled;
	// default value for global search
	this.data.parentPayload.searchAll = false;

	this.hasMore = new ReactiveVar(true);

	this.autorun(() => {
		const result = this.data.result.get();
		this.hasMore.set(!(result && result.message.docs.length < (this.data.payload.limit || this.pageSize)));
	});
});

Template.DefaultSearchResultTemplate.events({
	...getCommonRoomEvents(),
	'change #global-search'(e, t) {
		t.data.parentPayload.searchAll = e.target.checked;
		t.data.payload.limit = t.pageSize;
		t.data.result.set(undefined);
		t.data.search();
	},
	'scroll .rocket-default-search-results': _.throttle(function (e, t) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && t.hasMore.get()) {
			t.data.payload.limit = (t.data.payload.limit || t.pageSize) + t.pageSize;
			t.data.search();
		}
	}, 200),
});

Template.DefaultSearchResultTemplate.helpers({
	result() {
		return Template.instance().data.result.get();
	},
	globalSearchEnabled() {
		return Template.instance().globalSearchEnabled;
	},
	searching() {
		return Template.instance().data.searching.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageParse(msg) {
		const text = Template.instance().data.text.get();
		msg.searchedText = text;
		return { customClass: 'search', actionContext: 'search', ...msg, groupable: false };
	},
	messageContext() {
		const result = messageContext.call(this, { rid: Session.get('openedRoom') });
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply: false,
			},
		};
	},
});
