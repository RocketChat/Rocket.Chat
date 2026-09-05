import { Abac } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { callbacks } from '../../../../server/lib/callbacks';
import { settings } from '../../../../server/settings';

/**
 * ABAC-P4 M4 — records the attributes a room was created with.
 *
 * Attributes supplied at creation are written by the insert itself, which keeps creation atomic:
 * a room is never briefly locked between being created and being given its attributes. The audit
 * entry cannot be written before the insert, because there is no room id to attribute it to, so it
 * is written here.
 */
callbacks.add(
	'afterCreateRoom',
	async (owner: IUser, room: IRoom) => {
		if (!License.hasModule('abac') || !settings.get('ABAC_Enabled') || !room.abacAttributes?.length) {
			return;
		}

		await Abac.auditRoomAttributesAtCreation(room, {
			_id: owner._id,
			username: owner.username,
			name: owner.name,
		});
	},
	callbacks.priority.MEDIUM,
	'abac-audit-attributes-at-creation',
);
