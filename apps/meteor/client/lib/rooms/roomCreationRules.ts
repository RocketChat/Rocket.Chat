/**
 * Decides what a room being created may be: what the room ends up as once the workspace has its
 * say, and which of the toggles are still the creator's to move.
 */

export type RoomCreationDraft = {
	isPrivate: boolean;
	encrypted: boolean;
	broadcast: boolean;
	readOnly: boolean;
	federated?: boolean;
};

export type RoomCreationPolicy = {
	e2eEnabled: boolean;
	e2eEnforcedForPrivate: boolean;
	canSetReadOnly: boolean;
	canUseFederation?: boolean;
};

export type RoomCreationEditableFields = {
	encrypted: boolean;
	readOnly: boolean;
	broadcast: boolean;
	federated: boolean;
};

export type RoomCreation = {
	room: RoomCreationDraft;
	editable: RoomCreationEditableFields;
};

const resolveEncrypted = (draft: RoomCreationDraft, policy: RoomCreationPolicy): boolean => {
	if (!draft.isPrivate) {
		return false;
	}

	if (policy.e2eEnforcedForPrivate) {
		return true;
	}

	return draft.encrypted;
};

const resolveRoom = (draft: RoomCreationDraft, policy: RoomCreationPolicy): RoomCreationDraft => {
	if (draft.federated) {
		return { ...draft, encrypted: false, broadcast: false, readOnly: false };
	}

	return {
		...draft,
		encrypted: resolveEncrypted(draft, policy),
		readOnly: draft.broadcast || draft.readOnly,
	};
};

const resolveEditableFields = (room: RoomCreationDraft, policy: RoomCreationPolicy): RoomCreationEditableFields => ({
	encrypted: policy.e2eEnabled && room.isPrivate && !room.federated && !policy.e2eEnforcedForPrivate,
	readOnly: policy.canSetReadOnly && !room.broadcast && !room.federated,
	broadcast: !room.federated,
	federated: Boolean(policy.canUseFederation),
});

export const resolveRoomCreation = (draft: RoomCreationDraft, policy: RoomCreationPolicy): RoomCreation => {
	const room = resolveRoom(draft, policy);

	return { room, editable: resolveEditableFields(room, policy) };
};
