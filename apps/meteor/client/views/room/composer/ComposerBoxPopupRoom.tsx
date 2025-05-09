import type { IRoom } from '@rocket.chat/core-typings';
import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';

import { RoomIcon } from '../../../components/RoomIcon';

export type ComposerBoxPopupRoomProps = Pick<IRoom, 't' | 'name' | 'fname' | '_id' | 'prid' | 'teamMain' | 'u'>;

function ComposerBoxPopupRoom({ fname, name, ...props }: ComposerBoxPopupRoomProps) {
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
}

export default ComposerBoxPopupRoom;
