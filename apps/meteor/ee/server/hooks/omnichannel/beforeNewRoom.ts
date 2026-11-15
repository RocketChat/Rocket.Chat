import type { IOmnichannelRoomInfo, IOmnichannelRoomExtraData, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isPlainObject } from '../../../../lib/utils/isPlainObject';
import { beforeNewRoom } from '../../../../server/lib/omnichannel/hooks';

export const beforeNewRoomPatched = async (
	_next: any,
	roomInfo: IOmnichannelRoomInfo,
	extraData?: IOmnichannelRoomExtraData,
): Promise<Partial<IOmnichannelRoom>> => {
	if (!extraData) {
		return roomInfo;
	}

	const { sla: searchTerm, customFields } = extraData;
	const roomInfoWithExtraData = { ...roomInfo, ...(isPlainObject(customFields) && { customFields }) };

	if (!searchTerm) {
		return roomInfoWithExtraData;
	}

	const sla = await OmnichannelServiceLevelAgreements.findOneByIdOrName(searchTerm);
	if (!sla) {
		throw new Meteor.Error('error-invalid-sla', 'Invalid sla', {
			function: 'livechat.beforeRoom',
		});
	}

	const { _id: slaId } = sla;
	return { ...roomInfoWithExtraData, slaId };
};

beforeNewRoom.patch(beforeNewRoomPatched);
