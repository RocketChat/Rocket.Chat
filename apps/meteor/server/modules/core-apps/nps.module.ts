import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { Banner, NPS } from '../../sdk';
import { createModal } from './nps/createModal';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: any): Promise<any> {
		const {
			triggerId,
			actionId,
			container: { id: viewId },
			payload: { value: score, blockId: npsId },
			user,
		} = payload;

		const bannerId = viewId.replace(`${npsId}-`, '');

		return createModal({
			type: actionId === 'nps-score' ? 'modal.update' : 'modal.open',
			id: `${npsId}-${bannerId}`,
			appId: this.appId,
			npsId,
			triggerId,
			score,
			user,
		});
	}

	async viewSubmit(payload: any): Promise<any> {
		if (!payload.payload?.view?.state) {
			throw new Error('Invalid payload');
		}

		const {
			payload: {
				view: { state, id: viewId },
			},
			user: { _id: userId, roles },
		} = payload;

		const [npsId] = Object.keys(state);

		const bannerId = viewId.replace(`${npsId}-`, '');

		const {
			[npsId]: { 'nps-score': score, comment },
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
