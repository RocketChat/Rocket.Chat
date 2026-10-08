import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Field, FieldLabel } from '.';
import { CheckBox } from '../Inputs';

it('should stop acting on a wrapped input after it is replaced', async () => {
	const { container, rerender } = render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<CheckBox key='first' />
		</Field>,
	);

	const firstInput = container.querySelector('input');

	rerender(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<CheckBox key='second' />
		</Field>,
	);

	await userEvent.click(screen.getByText('Test Field', { selector: 'span' }));

	expect(firstInput?.checked).toBe(false);
	expect(container.querySelector('input')?.checked).toBe(true);
});
