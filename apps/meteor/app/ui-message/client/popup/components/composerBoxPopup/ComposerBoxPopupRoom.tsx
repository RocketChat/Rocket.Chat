import type { IRoom } from '@rocket.chat/core-typings';
import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import React from 'react';

import { RoomIcon } from '../../../../../../client/components/RoomIcon';

export type ComposerBoxPopupRoomProps = Pick<IRoom, 't' | 'name' | 'fname' | '_id' | 'prid' | 'teamMain' | 'u'>;

const ComposerBoxPopupRoom = ({ fname, name, ...props }: ComposerBoxPopupRoomProps) => {
	return (
		<>
			<OptionColumn>
				<RoomIcon room={props} />
			</OptionColumn>
			<OptionContent>
				<strong>{fname ?? name}</strong>
			</OptionContent>
		</>
	);
};

export default ComposerBoxPopupRoom;
