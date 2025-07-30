import { Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { dateToISOString, generateTimestampMarkup } from '../../../../../../../lib/utils/timestamp/conversion';
import type { TimestampFormat, TimezoneKey } from '../../../../../../../lib/utils/timestamp/types';
import GazzodownText from '../../../../../../GazzodownText';

type PreviewProps = {
	date: Date;
	format: TimestampFormat;
	timezone: TimezoneKey;
};

const Preview = ({ date, format, timezone }: PreviewProps): ReactElement => {
	const { t } = useTranslation();
	const timestamp = dateToISOString(date, timezone);
	const markup = generateTimestampMarkup(timestamp, format);
	const tokens = parse(markup);

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Preview')}</FieldLabel>
				<FieldRow>
					<GazzodownText>
						<Markup tokens={tokens} />
					</GazzodownText>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default Preview;
