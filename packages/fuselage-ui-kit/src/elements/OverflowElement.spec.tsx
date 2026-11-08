import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OverflowElement from './OverflowElement';
import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser } from '../surfaces';

const selectOption = async (url: string) => {
	const block: UiKit.OverflowElement = {
		type: 'overflow',
		appId: 'test',
		blockId: 'test',
		actionId: 'test',
		options: [{ value: 'open', text: { type: 'plain_text', text: 'Open' }, url }],
	};

	const action = jest.fn();

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, values: {} }}>
				<OverflowElement index={0} block={block} context={BlockContext.ACTION} surfaceRenderer={messageParser} />
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	await userEvent.click(screen.getByRole('button'));
	await userEvent.click(await screen.findByRole('option', { name: 'Open' }));

	return action;
};

beforeEach(() => {
	jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
	jest.restoreAllMocks();
});

it('opens a safe url without an opener', async () => {
	await selectOption('https://rocket.chat');

	expect(window.open).toHaveBeenCalledWith('https://rocket.chat', '_blank', 'noopener');
});

it('ignores an unsafe url', async () => {
	const action = await selectOption('javascript:alert(1)');

	expect(window.open).not.toHaveBeenCalled();
	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'test', value: 'open' }), expect.anything());
});
