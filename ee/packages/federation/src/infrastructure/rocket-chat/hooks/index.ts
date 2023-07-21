import type { FederationRoomServiceSender } from '../../../application/room/sender/RoomServiceSender';

export class FederationHooks {
	public static async afterRoomRoleChanged(federationRoomService: FederationRoomServiceSender, data?: Record<string, any>) {
		if (!data) {
			return;
		}
		const {
			_id: role,
			type: action,
			scope: internalRoomId,
			u: { _id: internalTargetUserId = undefined } = {},
			givenByUserId: internalUserId,
		} = data;
		const roleEventsInterestedIn = ['moderator', 'owner'];
		if (!roleEventsInterestedIn.includes(role)) {
			return;
		}
		const handlers: Record<string, (internalUserId: string, internalTargetUserId: string, internalRoomId: string) => Promise<void>> = {
			'owner-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomOwnerAdded(internalUserId, internalTargetUserId, internalRoomId),
			'owner-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomOwnerRemoved(internalUserId, internalTargetUserId, internalRoomId),
			'moderator-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomModeratorAdded(internalUserId, internalTargetUserId, internalRoomId),
			'moderator-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomModeratorRemoved(internalUserId, internalTargetUserId, internalRoomId),
		};
		if (!handlers[`${role}-${action}`]) {
			return;
		}
		await handlers[`${role}-${action}`](internalUserId, internalTargetUserId, internalRoomId);
	}
}
