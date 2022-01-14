import { Template } from 'meteor/templating';

import { modal } from '../../../ui-utils/client';
import { Apps } from '../orchestrator';
import { APIClient } from '../../../utils/client';

import './gameContainer.html';

const getExternalComponent = async () => {
	const {
		data: { game: externalComponent },
	} = Template.instance();
	const realAppClientUIHost = Apps.getUIHost();
	const currentUser = await realAppClientUIHost.getClientUserInfo();
	const currentRoom = await realAppClientUIHost.getClientRoomInfo();

	externalComponent.state = {
		currentUser,
		currentRoom,
	};

	return externalComponent;
};

Template.GameContainer.helpers({
	isContextualBar() {
		const {
			data: { game },
		} = Template.instance();
		const { location } = game;

		return location === 'CONTEXTUAL_BAR';
	},
	isModal() {
		const {
			data: { game },
		} = Template.instance();
		const { location } = game;

		return location === 'MODAL';
	},
});

Template.GameContainer.events({
	'click .rc-game__close'() {
		const {
			data: { clearGameManifestInfo },
		} = Template.instance();

		clearGameManifestInfo();
		modal.cancel();
	},
	'click .js-back'() {
		const {
			data: { clearGameManifestInfo },
		} = Template.instance();

		clearGameManifestInfo();
	},
});

Template.GameContainer.onCreated(async () => {
	const externalComponent = await getExternalComponent();

	APIClient.post('apps/externalComponentEvent', {
		event: 'IPostExternalComponentOpened',
		externalComponent,
	});
});

Template.GameContainer.onDestroyed(async () => {
	const externalComponent = await getExternalComponent();

	APIClient.post('apps/externalComponentEvent', {
		event: 'IPostExternalComponentClosed',
		externalComponent,
	});
});
