import { Box, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { formatTimestamp } from '../../../../../../../lib/utils/timestamp/conversion';
import type { TimestampFormat } from '../../../../../../../lib/utils/timestamp/types';

type PreviewProps = {
	date: Date;
	format: TimestampFormat;
};

const Preview = ({ date, format }: PreviewProps): ReactElement => {
	const { t } = useTranslation();

	const formattedDate = formatTimestamp(date, format);

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Preview')}</FieldLabel>
				<FieldRow>
					<TextInput
						value={formattedDate}
						readOnly
						style={{
							width: '100%',
							backgroundColor: '#f1f2f4',
						}}
					/>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default Preview;