import { Icon, Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IOmnichannelRoom } from '../../../../../../definition/IRoom';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useRoomIcon } from '../../../../../hooks/useRoomIcon';
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
		app: t('Custom_Integration'), // TODO: use app text
		api: t('Custom_Integration'), // TODO: use app text
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
		app: t('External'), // TODO: use app text
		api: t('External'),
		other: t('External'),
	};

	const sourceIcon = useRoomIcon(room) as { name: string; color?: string | undefined };

	const sourceName = sourceIcon?.name || '';

	return (
		<Field>
			<Label>{t('Channel')}</Label>
			<Info>
				<Box display='flex' alignItems='center'>
					<Icon name={sourceName} size='x24' />
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
