import { useMemo, lazy, LazyExoticComponent, FC } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../client/contexts/SettingsContext';

addAction('discussions', () => {
	const discussionEnabled = useSetting('Discussion_enabled');

	return useMemo(() => (discussionEnabled ? {
		groups: ['channel', 'group', 'direct'],
		id: 'discussions',
		title: 'Discussions',
		icon: 'discussion',
		template: lazy(() => import('../../../client/views/room/contextualBar/Discussions')) as LazyExoticComponent<FC>,
		full: true,
		order: 1,
	} : null), [discussionEnabled]);
});
