import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { Banner, NPS } from '../../sdk';
import { createModal } from './nps/createModal';
import { Notifications } from '../../../app/notifications/server';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: any): Promise<any> {
		console.log('nps.blockAction ->', payload);

		const {
			triggerId,
			actionId: bannerId,
			payload: {
				value: score,
				blockId: npsId,
			},
			user,
		} = payload;

		Notifications.notifyUser(user._id, 'uiInteraction', createModal({
			appId: this.appId,
			npsId,
			bannerId,
			triggerId,
			score,
			user,
		}));

		return {
			type: 'banner.close',
			triggerId,
			viewId: bannerId,
		};
	}

	async viewSubmit(payload: any): Promise<any> {
		console.log('viewSubmit.payload ->', JSON.stringify(payload, null, 2));

		if (!payload.payload?.view?.state) {
			throw new Error('Invalid payload');
		}

		const {
			payload: {
				view: {
					state,
					id: bannerId,
				},
			},
			user: {
				_id: userId,
				roles,
			},
		} = payload;

		const [npsId] = Object.keys(state);

		const {
			[npsId]: {
				score,
				comment,
			},
		} = state;

		await NPS.vote({
			npsId,
			userId,
			comment,
			roles,
			score,
		});

		await Banner.dismiss(userId, bannerId);

		return true;
	}
}
