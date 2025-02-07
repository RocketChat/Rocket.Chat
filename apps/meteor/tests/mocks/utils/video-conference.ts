import { faker } from '@faker-js/faker';
import type { IRoom, VideoConferenceType } from '@rocket.chat/core-typings';

const callId = faker.database.mongodbObjectId();
const uid = faker.database.mongodbObjectId();

export function createFakeVideoConfCall({ type, rid }: { type: VideoConferenceType; rid: IRoom['_id'] }) {
	return {
		type,
		rid,
		_id: callId,
		status: 0,
		createdBy: {
			_id: uid,
			username: faker.internet.userName(),
			name: faker.person.fullName(),
		},
		_updatedAt: faker.date.recent(),
		createdAt: faker.date.recent(),
		providerName: faker.company.name(),
	};
}

export function createFakeIncomingCall({ rid }: { rid: IRoom['_id'] }) {
	return {
		rid,
		uid,
		callId,
		dismissed: false,
	};
}
