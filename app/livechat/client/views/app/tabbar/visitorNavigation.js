import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';

import { ChatRoom } from '../../../../../models';
import { t } from '../../../../../utils';
import './visitorNavigation.html';
import { APIClient } from '../../../../../utils/client';

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

	pageTitle() {
		return this.navigation.page.title || t('Empty_title');
	},

	accessDateTime() {
		return moment(this.ts).format('L LTS');
	},
});

Template.visitorNavigation.onCreated(async function() {
	const currentData = Template.currentData();
	this.isLoading = new ReactiveVar(true);
	this.pages = new ReactiveVar([]);

	if (currentData && currentData.rid) {
		const { pages } = await APIClient.v1.get(`livechat/visitors.pagesVisited?roomId=${ currentData.rid }`);
		this.isLoading.set(false);
		this.pages.set(pages);
	}
});
