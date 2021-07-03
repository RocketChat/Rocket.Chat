import { useMemo } from 'react';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useTranslation } from '../../../client/contexts/TranslationContext';

addAction('webRTCVideo', () => {
	const t = useTranslation();
	const enabled = useSetting('WebRTC_Enabled') && (useSetting('Livechat_call_provider') === t('WebRTC'));

	const handleClick = () => { window.open('/', '_blank'); };

	return useMemo(() => (enabled ? {
		groups: ['live'],
		id: 'webRTCVideo',
		title: 'WebRTC_Call',
		icon: 'phone',
		action: handleClick,
		full: true,
		order: 4,
	} : null), [enabled, t]);
});
