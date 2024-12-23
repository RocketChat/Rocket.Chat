import type {
	AtLeast,
	ExternalVideoConference,
	IRoom,
	VideoConference,
	VideoConferenceCreateData,
	VideoConferenceType,
} from '@rocket.chat/core-typings';

type RoomRequiredFields = AtLeast<IRoom, '_id' | 't'>;
type VideoConferenceTypeCondition = (room: RoomRequiredFields, allowRinging: boolean) => Promise<boolean>;

const typeConditions: {
	data: VideoConferenceType | AtLeast<VideoConferenceCreateData, 'type'>;
	condition: VideoConferenceTypeCondition;
	priority: number;
}[] = [];

export const videoConfTypes = {
	registerVideoConferenceType(
		data: VideoConferenceType | AtLeast<VideoConferenceCreateData, 'type'>,
		condition: VideoConferenceTypeCondition,
		priority = 1,
	): void {
		typeConditions.push({ data, condition, priority });
		typeConditions.sort(({ priority: prior1 }, { priority: prior2 }) => prior2 - prior1);
	},

	async getTypeForRoom(room: RoomRequiredFields, allowRinging: boolean): Promise<AtLeast<VideoConferenceCreateData, 'type'>> {
		for await (const { data, condition } of typeConditions) {
			if (await condition(room, allowRinging)) {
				if (typeof data === 'string') {
					return {
						type: data,
					};
				}

				return data;
			}
		}

		return { type: 'videoconference' };
	},

	isCallManagedByApp(call: VideoConference): call is ExternalVideoConference {
		return call.type !== 'voip';
	},
};

videoConfTypes.registerVideoConferenceType('voip', async () => false);
videoConfTypes.registerVideoConferenceType({ type: 'livechat' }, async ({ t }) => t === 'l');
