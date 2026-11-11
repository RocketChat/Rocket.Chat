import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../../surfaces';

const ids = { appId: 'app', blockId: 'block', actionId: 'where' };
const placeholder = { type: 'plain_text', text: 'Pick one' } as const;

it.each([
	['channels_select', { ...ids, type: 'channels_select', placeholder }],
	['multi_channels_select', { ...ids, type: 'multi_channels_select', placeholder }],
	['conversations_select', { ...ids, type: 'conversations_select', placeholder }],
	['multi_conversations_select', { ...ids, type: 'multi_conversations_select', placeholder }],
] as [string, UiKit.InputBlock['element']][])('a %s shows its placeholder', (_type, element) => {
	render(modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Where' }, element }]), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate', () => ({ items: [] }) as any)
			.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: [], remove: [] }) as any)
			.build(),
	});

	expect(screen.getByPlaceholderText('Pick one')).toBeInTheDocument();
});
