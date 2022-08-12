import { useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../../client/views/room/lib/Toolbox';

addAction('snippeted-messages', () => {
	const snippetingEnabled = useSetting('Message_AllowSnippeting');
	return useMemo(
		() =>
			snippetingEnabled
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'snippeted-messages',
						title: 'snippet-message',
						icon: 'code',
						template: 'snippetedMessages',
						order: 20,
				  }
				: null,
		[snippetingEnabled],
	);
});
