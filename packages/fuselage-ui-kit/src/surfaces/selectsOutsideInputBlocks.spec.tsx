import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { messageParser } from '.';

const wrapper = mockAppRoot()
	.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [] }) as any)
	.withEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate', () => ({ items: [] }) as any)
	.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: [], remove: [] }) as any)
	.build();

it.each([
	'users_select',
	'channels_select',
	'conversations_select',
	'multi_users_select',
	'multi_channels_select',
	'multi_conversations_select',
] as const)('renders a %s inside an actions block', (type) => {
	render(<>{messageParser.render([{ type: 'actions', elements: [{ type, appId: 'app', blockId: 'block', actionId: 'pick' }] }])}</>, {
		wrapper,
	});

	expect(screen.getByRole('textbox')).toBeInTheDocument();
});
