import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';

const renderInput = (element: UiKit.NumberInputElement | UiKit.EmailTextInputElement | UiKit.UrlTextInputElement) =>
	render(
		<MockedServerContext>
			{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Field' }, element }])}
		</MockedServerContext>,
	);

const base = { appId: 'app', blockId: 'block', actionId: 'field' } as const;

it('renders a number input with its bounds and initial value', () => {
	renderInput({ ...base, type: 'number_input', isDecimalAllowed: false, minValue: '1', maxValue: '10', initialValue: '3' });

	const input = screen.getByRole('spinbutton');
	expect(input).toHaveValue(3);
	expect(input).toHaveAttribute('min', '1');
	expect(input).toHaveAttribute('max', '10');
	expect(input).toHaveAttribute('step', '1');
});

it('allows any step when decimals are allowed', () => {
	renderInput({ ...base, type: 'number_input', isDecimalAllowed: true });

	expect(screen.getByRole('spinbutton')).toHaveAttribute('step', 'any');
});

it.each([
	['email_text_input', 'email'],
	['url_text_input', 'url'],
] as const)('renders %s as an input of type %s', (type, inputType) => {
	renderInput({ ...base, type, initialValue: 'value' });

	expect(screen.getByDisplayValue('value')).toHaveAttribute('type', inputType);
});
