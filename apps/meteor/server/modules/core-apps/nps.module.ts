import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';
import { Banner, NPS } from '@rocket.chat/core-services';

import { createModal } from './nps/createModal';

export class Nps implements IUiKitCoreApp {
	appId = 'nps-core';

	async blockAction(payload: UiKitCoreAppPayload) {
		const {
			triggerId,
			actionId,
			container: { id: viewId } = {},
			payload: { value: score, blockId: npsId },
			user,
		} = payload;

		if (!viewId || !triggerId || !user || !npsId) {
			throw new Error('Invalid payload');
		}

		const bannerId = viewId.replace(`${npsId}-`, '');

		return createModal({
			type: actionId === 'nps-score' ? 'modal.update' : 'modal.open',
			id: `${npsId}-${bannerId}`,
			appId: this.appId,
			npsId,
			triggerId,
			score: String(score),
			user,
		});
	}

	async viewSubmit(payload: UiKitCoreAppPayload) {
		if (!payload.payload?.view?.state || !payload.payload?.view?.id) {
			throw new Error('Invalid payload');
		}

		const {
			payload: {
				view: { state, id: viewId },
			},
			user: { _id: userId, roles } = {},
		} = payload;

		const [npsId] = Object.keys(state);

		const bannerId = viewId.replace(`${npsId}-`, '');

		const {
			[npsId]: { 'nps-score': score, comment },
		} = state;

		await NPS.vote({
			npsId,
			userId,
			comment: String(comment),
			roles,
			score: Number(score),
		});

		if (!userId) {
			throw new Error('invalid user');
		}

		await Banner.dismiss(userId, bannerId);

		return true;
	}
}
