import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { NPS } from '../../sdk';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: any): Promise<any> {
		console.log('nps.blockAction ->', payload);

		const {
			triggerId,
			payload: {
				value: score,
			},
		} = payload;

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
			appId: this.appId,
			view: {
				appId: this.appId,
				type: 'modal',
				id: this.appId,
				title: {
					type: 'plain_text',
					text: 'We appreciate your feedback',
					emoji: false,
				},
				submit: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Send',
						emoji: false,
					},
					actionId: 'send-vote',
				},
				close: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Cancel',
						emoji: false,
					},
					actionId: 'cancel',
				},
				blocks: [{
					blockId: 'nps',
					type: 'input',
					element: {
						type: 'static_select',
						placeholder: {
							type: 'plain_text',
							text: 'Score',
							emoji: false,
						},
						initialValue: score,
						options,
						actionId: 'score',
					},
					label: {
						type: 'plain_text',
						text: 'Score',
						emoji: false,
					},
				},
				{
					blockId: 'nps',
					type: 'input',
					element: {
						type: 'plain_text_input',
						multiline: true,
						actionId: 'comment',
					},
					label: {
						type: 'plain_text',
						text: `Why did you chose ${ score }?`,
						emoji: false,
					},
				}],
			},
		};
	}

	async viewSubmit(payload: any): Promise<any> {
		console.log('viewSubmit.payload ->', JSON.stringify(payload, null, 2));

		// TODO use correct payload from uikit
		const {
			payload: {
				// view: {
				// 	state: {

				// 	}
				// },
				score,
				comment,
				npsId,
			},
			user: {
				_id: userId,
				roles,
			},
		} = payload;

		await NPS.vote({
			npsId,
			userId,
			comment,
			roles,
			score,
		});

		return true;
	}

	async viewClosed(): Promise<any> {
	}
}
