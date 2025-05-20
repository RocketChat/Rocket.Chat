import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { TIMESTAMP_FORMATS } from '../../../../../../../lib/utils/timestamp/formats';
import type { TimestampFormat, TimestampFormatConfig } from '../../../../../../../lib/utils/timestamp/types';


type FormatSelectorProps = {
	selectedFormat: TimestampFormat;
	onChange: (format: TimestampFormat) => void;
};

const FormatSelector = ({ selectedFormat, onChange }: FormatSelectorProps): ReactElement => {
	const { t } = useTranslation();

	const handleFormatChange = (value: string): void => {
		onChange(value as TimestampFormat);
	};

	const formatOptions = Object.entries(TIMESTAMP_FORMATS).map(([format, config]: [string, TimestampFormatConfig]) => ({
		value: format,
		label: t(config.label),
	}));

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Format')}</FieldLabel>
				<FieldRow>
					<Select
						value={selectedFormat}
						onChange={(value) => handleFormatChange(value as string)}
						options={formatOptions as any}
						style={{
							width: '100%',
						}}
					/>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default FormatSelector;