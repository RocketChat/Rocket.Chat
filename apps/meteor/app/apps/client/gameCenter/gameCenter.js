import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { modal } from '../../../ui-utils/client';
import { APIClient, t } from '../../../utils/client';
import './gameCenter.html';
import { handleError } from '../../../../client/lib/utils/handleError';

const getExternalComponents = async (instance) => {
	try {
		const { externalComponents } = await APIClient.get('apps/externalComponents');
		instance.games.set(externalComponents);
	} catch (e) {
		handleError(e);
	}

	instance.isLoading.set(false);
	instance.ready.set(true);
};

const openGame = (gameManifestInfo) => {
	const instance = Template.instance();
	const { location = 'MODAL' } = gameManifestInfo;

	if (location === 'CONTEXTUAL_BAR') {
		instance.gameManifestInfo.set(gameManifestInfo);
	} else if (location === 'MODAL') {
		modal.open({
			allowOutsideClick: false,
			data: {
				game: gameManifestInfo,
			},
			template: 'GameContainer',
			type: 'rc-game',
		});
	}
};

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
		return function (currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop >= currentTarget.scrollHeight - 100) {
				return instance.page.set(instance.page.get() + 1);
			}
		};
	},
	showGame() {
		return Template.instance().gameManifestInfo.get();
	},
	gameContainerOptions() {
		const { gameManifestInfo, clearGameManifestInfo } = Template.instance();

		return {
			game: gameManifestInfo.get(),
			showBackButton: true,
			clearGameManifestInfo,
		};
	},
});

Template.GameCenter.onCreated(function () {
	this.ready = new ReactiveVar(false);
	this.games = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(true);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);

	this.gameManifestInfo = new ReactiveVar(null);

	this.clearGameManifestInfo = () => {
		this.gameManifestInfo.set(null);
	};

	getExternalComponents(this);
});

Template.GameCenter.events({
	'click .rc-game-center__game'() {
		const gameManifestInfo = this;

		openGame(gameManifestInfo);
	},
	'click .js-invite'(event) {
		event.stopPropagation();
		modal.open({
			title: t('Apps_Game_Center_Invite_Friends'),
			content: 'InvitePlayers',
			data: this,
			confirmOnEnter: false,
			showCancelButton: false,
			showConfirmButton: false,
			html: false,
		});
	},
});
