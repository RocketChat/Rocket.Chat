import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

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
