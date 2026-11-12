import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { Key } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { TIMESTAMP_FORMATS } from '../../../../../../lib/utils/timestamp/formats';
import type { TimestampFormat, ITimestampFormatConfig } from '../../../../../../lib/utils/timestamp/types';

export type FormatSelectorProps = {
	value: TimestampFormat;
	onChange: (format: TimestampFormat) => void;
};

const FormatSelector = ({ value, onChange }: FormatSelectorProps) => {
	const { t } = useTranslation();
	const formatField = useId();

	const handleFormatChange = (key: Key): void => {
		onChange(key as TimestampFormat);
	};

	const formatOptions = Object.entries(TIMESTAMP_FORMATS).map(
		([format, config]: [string, ITimestampFormatConfig]) => [format, `${t(config.label)} (${t(config.description)})`] as const,
	);

	return (
		<Field>
			<FieldLabel htmlFor={formatField}>{t('Format')}</FieldLabel>
			<FieldRow>
				<Select id={formatField} value={value} onChange={handleFormatChange} options={formatOptions} />
			</FieldRow>
		</Field>
	);
};

export default FormatSelector;
