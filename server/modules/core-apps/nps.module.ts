import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { NPS } from '../../sdk';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: any): Promise<any> {
		console.log('blockAction ->', payload);

		// TODO use correct payload from uikit
		const {
			payload: {
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
}
