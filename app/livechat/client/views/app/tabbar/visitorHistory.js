import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import _ from 'underscore';

import './visitorHistory.html';
import { APIClient } from '../../../../../utils/client';

const ITEMS_COUNT = 50;

Template.visitorHistory.helpers({
	isLoading() {
		return Template.instance().isLoading.get();
	},

	previousChats() {
		return Template.instance().history.get();
	},

	title() {
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}

		return title;
	},
});

Template.visitorHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.visitorId = new ReactiveVar();
	this.isLoading = new ReactiveVar(false);
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ currentData.rid }`);
		if (room && room.v) {
			this.visitorId.set(room.v._id);
		}
	});

	this.autorun(async () => {
		this.isLoading.set(true);
		const offset = this.offset.get();
		if (!this.visitorId.get() || !currentData || !currentData.rid) {
			return;
		}
		const { history, total } = await APIClient.v1.get(`livechat/visitors.chatHistory/room/${ currentData.rid }/visitor/${ this.visitorId.get() }?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.isLoading.set(false);
		this.total.set(total);
		this.history.set(this.history.get().concat(history));
	});
});

Template.visitorHistory.events({
	'scroll .visitor-scroll': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			const history = instance.history.get();
			if (instance.total.get() <= history.length) {
				return;
			}
			return instance.offset.set(instance.offset.get() + ITEMS_COUNT);
		}
	}, 200),
});
