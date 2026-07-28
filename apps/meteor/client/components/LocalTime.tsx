import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimezoneTime } from '../hooks/useTimezoneTime';

export type LocalTimeProps = {
	utcOffset: number;
};

const LocalTime = ({ utcOffset }: LocalTimeProps) => {
	const time = useTimezoneTime(utcOffset, 10000);
	const { t } = useTranslation();

	return <>{t('__time__local_time', { time })}</>;
};

export default memo(LocalTime);
