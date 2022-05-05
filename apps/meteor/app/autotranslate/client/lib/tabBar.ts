import { lazy, useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';

addAction('autotranslate', () => {
	const hasPermission = usePermission('auto-translate');
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	return useMemo(
		() =>
			hasPermission && autoTranslateEnabled
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'autotranslate',
						title: 'Auto_Translate',
						icon: 'language',
						template: lazy(() => import('../../../../client/views/room/contextualBar/AutoTranslate')),
						order: 20,
						full: true,
				  }
				: null,
		[autoTranslateEnabled, hasPermission],
	);
});
