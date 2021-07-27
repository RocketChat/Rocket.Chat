import { useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../../client/contexts/SettingsContext';

addAction('snippeted-messages', () => {
	const snippetingEnabled = useSetting('Message_AllowSnippeting');
	return useMemo(() => (snippetingEnabled ? {
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		id: 'snippeted-messages',
		title: 'snippet-message',
		icon: 'code',
		template: 'snippetedMessages',
		order: 20,
	} : null), [snippetingEnabled]);
});
