import type { IRoom } from '@rocket.chat/core-typings';
import { ItemContent, ItemIcon, ItemTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../components/RoomIcon';

export type ComposerBoxPopupRoomProps = Pick<IRoom, 't' | 'name' | 'fname' | '_id' | 'prid' | 'teamMain' | 'u'>;

function ComposerBoxPopupRoom({ fname, name, ...props }: ComposerBoxPopupRoomProps) {
	const { t } = useTranslation();

	const getIconLabel = () => {
		if (props.prid) {
			return t('Discussion');
		}

		if (props.teamMain) {
			return props.t === 'p' ? t('Private_Team') : t('Team');
		}

		return props.t === 'p' ? t('Private_Channel') : t('Public_Channel');
	};

	return (
		<>
			<ItemIcon label={getIconLabel()}>
				<RoomIcon room={props} />
			</ItemIcon>
			<ItemContent>
				<ItemTitle>{fname ?? name}</ItemTitle>
			</ItemContent>
		</>
	);
}

export default ComposerBoxPopupRoom;
