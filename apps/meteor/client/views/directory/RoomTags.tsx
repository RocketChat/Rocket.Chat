import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type RoomTagsProps = {
	room: Serialized<IRoom>;
};

const RoomTags = ({ room }: RoomTagsProps) => {
	const { t } = useTranslation();

	return (
		<Box marginInline='x4' alignItems='center' display='flex' gap='x4' withTruncatedText>
			{room.default && <Tag variant='secondary'>{t('default')}</Tag>}
			{room.featured && <Tag variant='secondary'>{t('featured')}</Tag>}
		</Box>
	);
};

export default RoomTags;
