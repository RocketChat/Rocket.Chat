import React, { memo, ReactElement } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useUTCClock } from '../hooks/useUTCClock';

type LocalTimeProps = {
	utcOffset: number;
};

const LocalTime = ({ utcOffset }: LocalTimeProps): ReactElement => {
	const time = useUTCClock(utcOffset);
	const t = useTranslation();

	return <>{t('Local_Time_time', { time })}</>;
};

export default memo(LocalTime);
