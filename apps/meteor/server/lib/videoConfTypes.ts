import type { AtLeast, IRoom, VideoConferenceType } from '@rocket.chat/core-typings';

type RoomRequiredFields = AtLeast<IRoom, '_id' | 't'>;
type VideoConferenceTypeCondition = (room: RoomRequiredFields, allowRinging: boolean) => Promise<boolean>;

const typeConditions: { type: VideoConferenceType; condition: VideoConferenceTypeCondition; priority: number }[] = [];

export const videoConfTypes = {
	registerVideoConferenceType(type: VideoConferenceType, condition: VideoConferenceTypeCondition, priority = 1): void {
		typeConditions.push({ type, condition, priority });
		typeConditions.sort(({ priority: prior1 }, { priority: prior2 }) => prior2 - prior1);
	},

	async getTypeForRoom(room: RoomRequiredFields, allowRinging: boolean): Promise<VideoConferenceType> {
		for await (const { type, condition } of typeConditions) {
			if (await condition(room, allowRinging)) {
				return type;
			}
		}

		return 'videoconference';
	},
};

videoConfTypes.registerVideoConferenceType('livechat', async ({ t }) => t === 'l');
