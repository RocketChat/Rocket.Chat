import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUTCClock } from '../hooks/useUTCClock';

type LocalTimeProps = {
	utcOffset: number;
};

const LocalTime = ({ utcOffset }: LocalTimeProps) => {
	const time = useUTCClock(utcOffset);
	const { t } = useTranslation();

	return <>{t('Local_Time_time', { time })}</>;
};

export default memo(LocalTime);
