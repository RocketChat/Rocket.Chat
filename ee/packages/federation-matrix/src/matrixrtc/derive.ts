import { createHash } from 'node:crypto';

/** The slot every room-wide call uses: one call per room, whoever starts it. */
export const MATRIXRTC_ROOM_CALL_SLOT_ID = 'm.call#ROOM';

/** MSC4195's hash: the canonical JSON array of the inputs, SHA-256, unpadded standard base64. */
const hashOf = (...inputs: string[]): string => createHash('sha256').update(JSON.stringify(inputs)).digest('base64').replace(/=+$/, '');

/**
 * The LiveKit room a MatrixRTC session uses on every SFU that hosts part of it. Pseudonymous, so the SFU never
 * learns the Matrix room.
 */
export const liveKitRoomAliasFor = (matrixRoomId: string, slotId: string): string => hashOf(matrixRoomId, slotId);

/** The LiveKit identity of a Matrix 2.0 member: fresh for every join, since the member id is. */
export const liveKitIdentityFor = (matrixUserId: string, memberId: string): string => hashOf(matrixUserId, memberId);

/** The LiveKit identity of a member admitted through the OpenID `/get_token` endpoint. */
export const legacyLiveKitIdentityFor = (matrixUserId: string, deviceId: string, memberId: string): string =>
	hashOf(matrixUserId, deviceId, memberId);

/** The LiveKit identity of a member admitted through the oldest endpoint, `/sfu/get`. */
export const sfuGetLiveKitIdentityFor = (matrixUserId: string, deviceId: string): string => `${matrixUserId}:${deviceId}`;
