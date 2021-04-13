import { lazy, useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useSetting } from '../../../../client/contexts/SettingsContext';
import { useUserSubscription } from '../../../../client/contexts/UserContext';

const query = {};

addAction('autotranslate', ({ room }) => {
	const hasPermission = usePermission('auto-translate');
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const hasSubscription = !!useUserSubscription(room._id, query);

	return useMemo(() => (hasPermission && autoTranslateEnabled && hasSubscription ? {
		groups: ['channel', 'group', 'direct', 'team'],
		id: 'autotranslate',
		title: 'Auto_Translate',
		icon: 'language',
		template: lazy(() => import('../../../../client/views/room/contextualBar/AutoTranslate')),
		order: 20,
		full: true,
	} : null), [autoTranslateEnabled, hasPermission, hasSubscription]);
});
