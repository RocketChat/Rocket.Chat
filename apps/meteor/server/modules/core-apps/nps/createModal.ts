import type { IUser } from '@rocket.chat/core-typings';
import { Translation } from '@rocket.chat/core-services';

import { settings } from '../../../../app/settings/server';

type ModalParams = {
	id: string;
	type: string;
	appId: string;
	npsId: string;
	triggerId: string;
	score: string;
	user: IUser;
};

export const createModal = async ({ type = 'modal.open', id, appId, npsId, triggerId, score, user }: ModalParams): Promise<any> => {
	const language = user.language || settings.get('Language') || 'en';

	return {
		type,
		triggerId,
		appId,
		view: {
			appId,
			type: 'modal',
			id,
			title: {
				type: 'plain_text',
				text: await Translation.translateText('We_appreciate_your_feedback', language),
				emoji: false,
			},
			submit: {
				type: 'button',
				text: {
					type: 'plain_text',
					text: await Translation.translateText('Send', language),
					emoji: false,
				},
				actionId: 'send-vote',
			},
			close: {
				type: 'button',
				text: {
					type: 'plain_text',
					text: await Translation.translateText('Cancel', language),
					emoji: false,
				},
				actionId: 'cancel',
			},
			blocks: [
				{
					blockId: npsId,
					type: 'actions',
					elements: [
						{
							type: 'linear_scale',
							initialValue: score,
							actionId: 'nps-score',
							preLabel: { type: 'plain_text', text: await Translation.translateText('Not_likely', language) },
							postLabel: {
								type: 'plain_text',
								text: await Translation.translateText('Extremely_likely', language),
							},
						},
					],
					label: {
						type: 'plain_text',
						text: await Translation.translateText('Score', language),
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
						text: await Translation.translateText('Why_did_you_chose__score__', language, { interpolate: { score } }),
						emoji: false,
					},
				},
			],
		},
	};
};
