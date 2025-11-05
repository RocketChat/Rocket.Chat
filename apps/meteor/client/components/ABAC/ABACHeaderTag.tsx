import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Palette } from '@rocket.chat/fuselage';
import { HeaderTag } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type ABACHeaderTagProps = {
	room: IRoom;
};

const ABACHeaderTag = ({ room }: ABACHeaderTagProps) => {
	const { t } = useTranslation();

	// @ts-expect-error to be implemented
	if (!room.abacAttributes) {
		return null;
	}

	return (
		<HeaderTag title={t('ABAC_header_tag_title')}>
			<Box color={Palette.statusColor['status-font-on-warning'].toString()} fontWeight='700'>
				{t('ABAC_header_tag')}
			</Box>
		</HeaderTag>
	);
};

export default ABACHeaderTag;
