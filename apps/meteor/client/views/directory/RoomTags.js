import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

function RoomTags({ room }) {
	const t = useTranslation();
	return (
		<Box mi='x4' alignItems='center' display='flex'>
			<Margins inline='x2'>
				{room.default && <Tag variant='primary'>{t('default')}</Tag>}
				{room.featured && <Tag variant='primary'>{t('featured')}</Tag>}
			</Margins>
		</Box>
	);
}

export default RoomTags;
