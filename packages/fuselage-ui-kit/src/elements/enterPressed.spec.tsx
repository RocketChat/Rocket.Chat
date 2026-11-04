import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

const base = { appId: 'app', blockId: 'block', actionId: 'field' } as const;

const renderElement = (element: any, action = jest.fn()) =>
	render(
		<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, viewId: 'view' }}>
			{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Field' }, element }])}
		</UiKitContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);

it('sends the current value when Enter is pressed in a single-line input', async () => {
	const action = jest.fn();
	renderElement({ ...base, type: 'plain_text_input', dispatchActionConfig: ['on_enter_pressed'] }, action);

	await userEvent.type(screen.getByRole('textbox'), 'hello{Enter}');

	expect(action).toHaveBeenCalledTimes(1);
	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'field', value: 'hello', viewId: 'view' }), expect.anything());
});

it('sends from number inputs too', async () => {
	const action = jest.fn();
	renderElement({ ...base, type: 'number_input', is_decimal_allowed: false, dispatchActionConfig: ['on_enter_pressed'] }, action);

	await userEvent.type(screen.getByRole('spinbutton'), '42{Enter}');

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ value: '42' }), expect.anything());
});

it('keeps Enter as a newline in a multiline input', async () => {
	const action = jest.fn();
	renderElement({ ...base, type: 'plain_text_input', multiline: true, dispatchActionConfig: ['on_enter_pressed'] }, action);

	await userEvent.type(screen.getByRole('textbox'), 'a{Enter}b');

	expect(action).not.toHaveBeenCalled();
	expect(screen.getByRole('textbox')).toHaveValue('a\nb');
});

it('sends from a rich text input on Enter but keeps Shift+Enter as a newline', async () => {
	const action = jest.fn();
	renderElement({ ...base, type: 'rich_text_input', dispatchActionConfig: ['on_enter_pressed'] }, action);

	await userEvent.type(screen.getByRole('textbox'), 'a{Shift>}{Enter}{/Shift}b');
	expect(action).not.toHaveBeenCalled();
	expect(screen.getByRole('textbox')).toHaveValue('a\nb');

	await userEvent.type(screen.getByRole('textbox'), '{Enter}');
	expect(action).toHaveBeenCalledWith(
		expect.objectContaining({ actionId: 'field', value: expect.objectContaining({ type: 'rich_text' }) }),
		expect.anything(),
	);
});

it('does not send on Enter without the config', async () => {
	const action = jest.fn();
	renderElement({ ...base, type: 'plain_text_input' }, action);

	await userEvent.type(screen.getByRole('textbox'), 'hello{Enter}');

	expect(action).not.toHaveBeenCalled();
});
