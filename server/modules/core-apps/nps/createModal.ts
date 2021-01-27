import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../app/settings/server';
import { IUser } from '../../../../definition/IUser';

export type ModalParams = {
	appId: string;
	npsId: string;
	bannerId: string;
	triggerId: string;
	score: string;
	user: IUser;
}

export const createModal = Meteor.bindEnvironment(({ appId, npsId, bannerId, triggerId, score, user }: ModalParams): any => {
	const language = user.language || settings.get('Language') || 'en';

	const options = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((score) => ({
		text: {
			type: 'plain_text',
			text: score,
			emoji: true,
		},
		value: score,
	}));

	return {
		type: 'modal.open',
		triggerId,
		appId,
		view: {
			appId,
			type: 'modal',
			id: bannerId,
			title: {
				type: 'plain_text',
				text: TAPi18n.__('We_appreciate_your_feedback', { lng: language }),
				emoji: false,
			},
			submit: {
				type: 'button',
				text: {
					type: 'plain_text',
					text: TAPi18n.__('Send', { lng: language }),
					emoji: false,
				},
				actionId: 'send-vote',
			},
			close: {
				type: 'button',
				text: {
					type: 'plain_text',
					text: TAPi18n.__('Cancel', { lng: language }),
					emoji: false,
				},
				actionId: 'cancel',
			},
			blocks: [{
				blockId: npsId,
				type: 'input',
				element: {
					type: 'static_select',
					placeholder: {
						type: 'plain_text',
						text: TAPi18n.__('Score', { lng: language }),
						emoji: false,
					},
					initialValue: score,
					options,
					actionId: 'score',
				},
				label: {
					type: 'plain_text',
					text: TAPi18n.__('Score', { lng: language }),
					emoji: false,
				},
			},
			{
				blockId: npsId,
				type: 'input',
				element: {
					type: 'plain_text_input',
					multiline: true,
					actionId: 'comment',
				},
				label: {
					type: 'plain_text',
					text: TAPi18n.__('Why_did_you_chose__score__', { score, lng: language }),
					emoji: false,
				},
			}],
		},
	};
});
