import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { formatTimestamp } from '../../../../../../../lib/utils/timestamp/conversion';
import type { TimestampFormat } from '../../../../../../../lib/utils/timestamp/types';

type PreviewProps = {
	date: Date;
	format: TimestampFormat;
};

const Preview = ({ date, format }: PreviewProps): ReactElement => {
	const t = useTranslation();
	const language = useUserPreference<string>('language') || 'en';

	const formattedDate = formatTimestamp(date, format, language);

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Preview')}</FieldLabel>
				<FieldRow>
					<InputBox type='text' value={formattedDate} readOnly w='full' />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default Preview;
