import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactElement, Key } from 'react';
import { useTranslation } from 'react-i18next';

import { TIMESTAMP_FORMATS } from '../../../../../../../lib/utils/timestamp/formats';
import type { TimestampFormat, ITimestampFormatConfig } from '../../../../../../../lib/utils/timestamp/types';

type FormatSelectorProps = {
	selectedFormat: TimestampFormat;
	onChange: (format: TimestampFormat) => void;
};

const FormatSelector = ({ selectedFormat, onChange }: FormatSelectorProps): ReactElement => {
	const { t } = useTranslation();

	const handleFormatChange = (key: Key): void => {
		onChange(key as TimestampFormat);
	};

	const formatOptions = Object.entries(TIMESTAMP_FORMATS).map(
		([format, config]: [string, ITimestampFormatConfig]) => [format, `${t(config.label)} (${config.description})`] as const,
	);

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Format')}</FieldLabel>
				<FieldRow>
					<Select value={selectedFormat} onChange={handleFormatChange} options={formatOptions} width='full' />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default FormatSelector;
