import { useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const AutoTranslate = lazy(() => import('../../views/room/contextualBar/AutoTranslate'));

export const useAutotranslateRoomAction = () => {
	const permitted = usePermission('auto-translate');
	const enabled = useSetting('AutoTranslate_Enabled', false);

	useEffect(() => {
		if (!permitted || !enabled) {
			return;
		}

		return ui.addRoomAction('autotranslate', () => {
			return {
				groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
				id: 'autotranslate',
				title: 'Auto_Translate',
				icon: 'language',
				template: AutoTranslate,
				order: 20,
				full: true,
			};
		});
	}, [enabled, permitted]);
};
