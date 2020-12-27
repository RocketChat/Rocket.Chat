import React, { FC, memo } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useUTCClock } from '../hooks/useUTCClock';

type LocalTimeProps = {
	utcOffset: number | string;
};

const LocalTime: FC<LocalTimeProps> = ({ utcOffset }) => {
	const t = useTranslation();
	const time = useUTCClock(utcOffset);

	return <>{t('Local_Time_time', { time })}</>;
};

export default memo(LocalTime);
