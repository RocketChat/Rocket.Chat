import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { bannerParser } from '../surfaces';

const renderIconButton = (element: Partial<UiKit.IconButtonElement>) =>
	render(
		<MockedServerContext>
			{bannerParser.render([
				{
					type: 'actions',
					elements: [
						{
							type: 'icon_button',
							appId: 'app',
							blockId: 'block',
							actionId: 'action',
							icon: { type: 'icon', icon: 'info', variant: 'default' },
							label: 'More info',
							...element,
						} as UiKit.IconButtonElement,
					],
				},
			] as any)}
		</MockedServerContext>,
	);

it('names the button after its label', () => {
	renderIconButton({});

	expect(screen.getByRole('button', { name: 'More info' })).toHaveAttribute('title', 'More info');
});

it('names the link after its label', () => {
	renderIconButton({ url: 'https://rocket.chat' });

	expect(screen.getByRole('link', { name: 'More info' })).toHaveAttribute('href', 'https://rocket.chat');
});
