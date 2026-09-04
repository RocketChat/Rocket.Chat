import { getRoomLockContext } from '../../../../server/lib/authorization/isRoomLocked';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';

/**
 * ABAC-P4/D6, D7 — while enforcement is on, the creation paths that cannot produce a compliant room
 * are refused server-side.
 *
 * `beforeCreateRoomCallback` is the right seam because every non-DM creation path funnels through
 * `createRoom`: the Meteor methods, `channels.create` / `groups.create`, team creation, the
 * Apps-Engine room bridge, and `/invite-all-to` (which creates its target room). Guarding here
 * rather than at each entry point is what stops a new caller becoming a new bypass.
 *
 * 1-on-1 and Group DMs never reach this callback — `createRoom` returns through `createDirectRoom`
 * well before it runs — so D1 needs no condition here.
 */
beforeCreateRoomCallback.add(
	({ room }) => {
		const { enforcementOn } = getRoomLockContext();

		if (!enforcementOn) {
			return;
		}

		// Federated (D8) and Omnichannel/Livechat rooms are out of scope entirely.
		if (room.federated === true || room.t === 'l') {
			return;
		}

		// A discussion has no attribute-assignment surface of its own, so under enforcement it could
		// only ever be created locked. `Discussion_enabled` is also held at false (D10), which blocks
		// the usual path — this covers the callers that bypass that setting.
		if ('prid' in room && room.prid) {
			throw new Error('error-abac-discussion-creation-blocked');
		}

		// Public channels are blocked: enforcement locks ABAC-managed on, which forces Private on.
		if (room.t === 'c') {
			throw new Error('error-abac-public-room-creation-blocked');
		}
	},
	callbacks.priority.HIGH,
	'abac-block-non-compliant-room-creation',
);
