import { useMemo, lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../client/contexts/SettingsContext';

const template = lazy(() => import('../../../client/views/room/contextualBar/Discussions'));

addAction('discussions', ({ room: { prid } }) => {
	const discussionEnabled = useSetting('Discussion_enabled');

	return useMemo(() => (discussionEnabled && !prid ? {
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		id: 'discussions',
		title: 'Discussions',
		icon: 'discussion',
		template,
		full: true,
		order: 3,
	} : null), [discussionEnabled, prid]);
});
