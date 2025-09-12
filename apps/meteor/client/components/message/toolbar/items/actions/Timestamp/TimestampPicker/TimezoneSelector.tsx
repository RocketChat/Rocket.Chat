import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactElement, Key } from 'react';
import { useTranslation } from 'react-i18next';

import { UTCOffsets } from '../../../../../../../lib/utils/timestamp/types';
import type { TimezoneKey } from '../../../../../../../lib/utils/timestamp/types';

type TimezoneSelectorProps = {
	value: TimezoneKey;
	onChange: (timezone: TimezoneKey) => void;
};

const TimezoneSelector = ({ value, onChange }: TimezoneSelectorProps): ReactElement => {
	const { t } = useTranslation();

	const handleTimezoneChange = (key: Key): void => {
		onChange(key as TimezoneKey);
	};

	const options: [string, string][] = [
		['local', t('Local_Time')],
		...Object.entries(UTCOffsets).map(([label]) => [label, label] as [string, string]),
	];

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Timezone')}</FieldLabel>
				<FieldRow>
					<Select value={value} onChange={handleTimezoneChange} options={options} width='full' />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default TimezoneSelector;
