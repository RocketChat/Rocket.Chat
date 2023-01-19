import type { IRoom } from '@rocket.chat/core-typings';

export interface IAppsListenerService {
	roomEvent(interaction: string, room: IRoom): Promise<boolean | IRoom>;
}
