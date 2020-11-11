import { useMemo } from 'react';

import { addAction } from '../../../../client/channel/lib/Toolbox';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useSetting } from '../../../../client/contexts/SettingsContext';


addAction('autotranslate', () => {
	const hasPermission = usePermission('auto-translate');
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	return useMemo(() => (hasPermission && autoTranslateEnabled ? {
		groups: ['channel', 'group', 'direct'],
		id: 'autotranslate',
		title: 'Auto_Translate',
		icon: 'language',
		template: 'autoTranslateFlexTab',
		order: 20,
	} : null), [autoTranslateEnabled, hasPermission]);
});
