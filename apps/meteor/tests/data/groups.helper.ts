import { api, credentials, request } from './api-data';

export const createGroup = ({ name }: { name: string }) => {
	if (!name) {
		throw new Error('"name" is required in "createGroup" test helper');
	}
	return request.post(api('groups.create')).set(credentials).send({ name });
};

export const deleteGroup = ({ groupId, roomName }: { groupId?: string; roomName?: string }) => {
	if (!groupId && !roomName) {
		throw new Error('"groupId" or "roomName" is required in "deleteGroup" test helper');
	}

	return request
		.post(api('groups.delete'))
		.set(credentials)
		.send({
			...(groupId && { groupId }),
			...(roomName && { roomName }),
		});
};
