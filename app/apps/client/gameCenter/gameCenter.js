import toastr from 'toastr';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { APIClient } from '../../../utils';

const getactivatedGames = async (instance) => {
	try {
		const data = await APIClient.get('apps');
		const activatedGames = data.apps.filter((app) =>
			app.status === 'manually_enabled'
			&& app.category && app.category === 'game'
		);
		const games = activatedGames.map((game) => ({ latest: game }));
		instance.games.set(games);
	} catch (e) {
		toastr.error((e.xhr.responseJSON && e.xhr.responseJSON.error) || e.message);
	}

	instance.isLoading.set(false);
	instance.ready.set(true);
};

Template.GameCenter.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.games = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(true);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);

	getactivatedGames(instance);
});

Template.GameCenter.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}
		return false;
	},
	games() {
		return Template.instance().games.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		if (instance.loading || instance.end.get()) {
			return;
		}
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop >= currentTarget.scrollHeight - 100) {
				return instance.page.set(instance.page.get() + 1);
			}
		};
	},
});
