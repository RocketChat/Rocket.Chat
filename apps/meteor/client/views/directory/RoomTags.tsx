import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const RoomTags = ({ room }: { room: IRoom }): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box mi={4} alignItems='center' display='flex' withTruncatedText>
			<Margins inline={2}>
				{room.default && <Tag variant='secondary'>{t('default')}</Tag>}
				{room.featured && <Tag variant='secondary'>{t('featured')}</Tag>}
			</Margins>
		</Box>
	);
};

export default RoomTags;
