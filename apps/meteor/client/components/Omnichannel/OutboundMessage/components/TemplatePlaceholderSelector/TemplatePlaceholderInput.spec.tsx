import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplatePlaceholderInput from './TemplatePlaceholderInput';
import type TemplatePlaceholderSelector from './TemplatePlaceholderSelector';

const appRoot = mockAppRoot().build();

jest.mock('./TemplatePlaceholderSelector', () => ({ onSelect, onOpenChange }: React.ComponentProps<typeof TemplatePlaceholderSelector>) => (
	<div>
		<button type='button' onClick={() => onSelect('Selected value')}>
			Placeholder
		</button>
		<button type='button' onClick={() => onOpenChange?.(false)}>
			Close
		</button>
	</div>
));

it('should call onChange when value changes', async () => {
	const onChange = jest.fn();
	render(<TemplatePlaceholderInput value='' onChange={onChange} />, { wrapper: appRoot });

	await userEvent.type(screen.getByRole('textbox'), 'Hi');

	expect(onChange).toHaveBeenCalledTimes(2);
	expect(onChange).toHaveBeenCalledWith('H');
	expect(onChange).toHaveBeenCalledWith('i');
});

it('should call onChange when a placeholder is selected', async () => {
	const onChange = jest.fn();
	render(<TemplatePlaceholderInput value='' onChange={onChange} />, { wrapper: appRoot });

	await userEvent.click(screen.getByRole('button', { name: 'Placeholder' }));

	expect(onChange).toHaveBeenCalledWith('Selected value');
});

it('should focus the input when the placeholder menu is closed', async () => {
	render(<TemplatePlaceholderInput value='' onChange={jest.fn()} />, { wrapper: appRoot });

	await userEvent.click(screen.getByRole('button', { name: 'Placeholder' }));

	expect(screen.getByRole('textbox')).not.toHaveFocus();

	await userEvent.click(screen.getByRole('button', { name: 'Close' }));

	expect(screen.getByRole('textbox')).toHaveFocus();
});
