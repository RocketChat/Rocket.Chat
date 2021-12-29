import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import _ from 'underscore';

import { ChatRoom } from '../../../../../models';
import { t } from '../../../../../utils';
import './visitorNavigation.html';
import { APIClient } from '../../../../../utils/client';

const ITEMS_COUNT = 50;

Template.visitorNavigation.helpers({
	loadingNavigation() {
		return Template.instance().isLoading.get();
	},

	pages() {
		const room = ChatRoom.findOne({ _id: this.rid }, { fields: { 'v.token': 1 } });

		if (room) {
			return Template.instance().pages.get();
		}
	},

	onTableScroll() {
		const instance = Template.instance();
		return function (currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop >= currentTarget.scrollHeight - 100) {
				return instance.limit.set(instance.limit.get() + 50);
			}
		};
	},

	pageTitle() {
		return this.navigation.page.title || t('Empty_title');
	},

	accessDateTime() {
		return moment(this.ts).format('L LTS');
	},
});

Template.visitorNavigation.events({
	'scroll .visitor-scroll': _.throttle(function (e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
			const pages = instance.pages.get();
			if (instance.total.get() <= pages.length) {
				return;
			}
			return instance.offset.set(instance.offset.get() + ITEMS_COUNT);
		}
	}, 200),
});

Template.visitorNavigation.onCreated(async function () {
	const currentData = Template.currentData();
	this.isLoading = new ReactiveVar(true);
	this.pages = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.ready = new ReactiveVar(true);
	this.total = new ReactiveVar(0);

	this.autorun(async () => {
		this.isLoading.set(true);
		const offset = this.offset.get();
		if (currentData && currentData.rid) {
			const { pages, total } = await APIClient.v1.get(
				`livechat/visitors.pagesVisited/${currentData.rid}?count=${ITEMS_COUNT}&offset=${offset}`,
			);
			this.isLoading.set(false);
			this.total.set(total);
			this.pages.set(this.pages.get().concat(pages));
		}
		this.isLoading.set(false);
	});
});
