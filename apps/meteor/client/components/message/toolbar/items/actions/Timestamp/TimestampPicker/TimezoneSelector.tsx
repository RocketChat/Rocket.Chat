import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import moment from 'moment-timezone';
import type { ReactElement, Key } from 'react';
import { useTranslation } from 'react-i18next';

type TimezoneSelectorProps = {
	selectedTimezone: string;
	onChange: (timezone: string) => void;
};

const TimezoneSelector = ({ selectedTimezone, onChange }: TimezoneSelectorProps): ReactElement => {
	const { t } = useTranslation();

	const handleTimezoneChange = (key: Key): void => {
		onChange(key as string);
	};

	const getPopularTimezones = () => {
		const popular = [
			'UTC',

			// Americas (West → East)
			'America/Los_Angeles', // Los Angeles (UTC-8/-7)
			'America/Denver', // Denver (UTC-7/-6)
			'America/Chicago', // Chicago (UTC-6/-5)
			'America/New_York', // New York (UTC-5/-4)
			'America/Toronto', // Toronto (UTC-5/-4)
			'America/Sao_Paulo', // São Paulo (UTC-3)

			// Europe (West → East)
			'Europe/London', // London (UTC+0/+1)
			'Europe/Paris', // Paris (UTC+1/+2)
			'Europe/Berlin', // Berlin (UTC+1/+2)
			'Europe/Rome', // Rome (UTC+1/+2)
			'Europe/Moscow', // Moscow (UTC+3)

			// Asia (West → East)
			'Asia/Dubai', // Dubai (UTC+4)
			'Asia/Mumbai', // Mumbai (UTC+5:30)
			'Asia/Bangkok', // Bangkok (UTC+7)
			'Asia/Shanghai', // Shanghai (UTC+8)
			'Asia/Tokyo', // Tokyo (UTC+9)
			'Asia/Seoul', // Seoul (UTC+9)

			// Oceania
			'Australia/Sydney', // Sydney (UTC+10/+11)
			'Pacific/Auckland', // Auckland (UTC+12/+13)
		];

		return popular.map((tz) => {
			const now = moment.tz(tz);
			const offset = now.format('Z');
			const abbr = now.format('z');

			return [tz, `${tz.split('/').pop()?.replace('_', ' ')} (${abbr} ${offset})`] as const;
		});
	};

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Timezone')}</FieldLabel>
				<FieldRow>
					<Select value={selectedTimezone} onChange={handleTimezoneChange} options={getPopularTimezones()} width='full' />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default TimezoneSelector;
