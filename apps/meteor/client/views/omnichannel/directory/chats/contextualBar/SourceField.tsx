import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';

type SourceFieldProps = {
	room: IOmnichannelRoom;
};

const SourceField: FC<SourceFieldProps> = ({ room }) => {
	const t = useTranslation();

	const roomSource = room.source.alias || room.source.id || room.source.type;

	// TODO: create a hook that gets the default types values (alias, icons, ids, etc...)
	// so we don't have to write this object again and again
	const defaultTypesLabels: {
		widget: string;
		email: string;
		sms: string;
		app: string;
		api: string;
		other: string;
	} = {
		widget: t('Livechat'),
		email: t('Email'),
		sms: t('SMS'),
		app: room.source.alias || t('Custom_Integration'),
		api: room.source.alias || t('Custom_Integration'),
		other: t('Custom_Integration'),
	};

	const defaultTypesVisitorData: {
		widget: string | undefined;
		email: string | undefined;
		sms: string;
		app: string;
		api: string;
		other: string;
	} = {
		widget: '',
		email: room?.source.id,
		sms: t('External'),
		app: room.source.label || t('External'),
		api: room.source.label || t('External'),
		other: t('External'),
	};

	return (
		<Field>
			<Label>{t('Channel')}</Label>
			<Info>
				<Box display='flex' alignItems='center'>
					<OmnichannelRoomIcon room={room} size='x24' placement='default' />
					<Label mi='x8' mbe='0'>
						{defaultTypesLabels[room.source.type] || roomSource}
					</Label>
					{defaultTypesVisitorData[room.source.type]}
				</Box>
			</Info>
		</Field>
	);
};

export default SourceField;
