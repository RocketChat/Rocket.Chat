import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { absoluteUrl } from '../../../lib/absoluteUrl';

export const useCorsSSLConfig = () => {
	const forceSSlSetting = useSetting('Force_SSL');

	useEffect(() => {
		absoluteUrl.defaultOptions.secure = Boolean(forceSSlSetting);
	}, [forceSSlSetting]);
};
