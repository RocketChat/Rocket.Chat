import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import ButtonElement from './ButtonElement';
import { messageParser } from '../surfaces';

const renderButton = (overrides: Partial<UiKit.ButtonElement>) => {
	const block: UiKit.ButtonElement = {
		type: 'button',
		appId: 'test',
		blockId: 'test',
		actionId: 'test',
		text: { type: 'plain_text', text: 'Open' },
		...overrides,
	};

	render(
		<MockedServerContext>
			<ButtonElement index={0} block={block} context={BlockContext.ACTION} surfaceRenderer={messageParser} />
		</MockedServerContext>,
	);
};

it('is announced by its accessibility label when one is set', () => {
	renderButton({ accessibility_label: 'Open the quarterly report' });

	expect(screen.getByRole('button', { name: 'Open the quarterly report' })).toBeInTheDocument();
});

it('is announced by its text otherwise', () => {
	renderButton({});

	expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
});
