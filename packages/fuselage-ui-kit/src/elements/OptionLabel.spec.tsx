import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';

const options: UiKit.Option[] = [
	{ text: { type: 'plain_text', text: 'Starter' }, value: 'starter', description: { type: 'plain_text', text: 'Up to 5 seats' } },
	{ text: { type: 'plain_text', text: 'Pro' }, value: 'pro' },
];

it.each([
	['checkbox', 'checkbox'],
	['radio_button', 'radio'],
] as const)('labels each %s option and shows its description', (type, role) => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Plan' },
					element: { type, appId: 'app', blockId: 'block', actionId: 'plan', options },
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole(role, { name: /Starter/ })).toBeInTheDocument();
	expect(screen.getByRole(role, { name: 'Pro' })).toBeInTheDocument();
	expect(screen.getByText('Up to 5 seats')).toBeInTheDocument();
});
