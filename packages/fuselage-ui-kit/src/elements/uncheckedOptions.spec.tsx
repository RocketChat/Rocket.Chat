import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { modalParser } from '../surfaces';

const options: UiKit.Option[] = [
	{ text: { type: 'plain_text', text: 'A' }, value: 'a' },
	{ text: { type: 'plain_text', text: 'B' }, value: 'b' },
];

let consoleError: jest.SpyInstance;

beforeEach(() => {
	consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	consoleError.mockRestore();
});

it.each(['checkbox', 'toggle_switch'] as const)('starts a %s with no initial options as a controlled, unchecked input', async (type) => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Pick' },
					element: { type, appId: 'app', blockId: 'block', actionId: 'pick', options },
				},
			])}
		</MockedServerContext>,
	);

	const [first, second] = screen.getAllByRole('checkbox');
	expect(first).not.toBeChecked();
	expect(second).not.toBeChecked();

	await userEvent.click(first);

	expect(first).toBeChecked();
	expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/uncontrolled input to be controlled/);
});
