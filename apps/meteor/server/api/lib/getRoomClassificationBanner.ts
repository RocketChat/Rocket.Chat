import type { ClassificationBannerPayload, IRoom } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const getRoomClassificationBanner = makeFunction(
	async (_room: Pick<IRoom, 't' | 'abacAttributes' | 'federated' | 'prid' | 'teamId'>): Promise<ClassificationBannerPayload | undefined> =>
		undefined,
);
