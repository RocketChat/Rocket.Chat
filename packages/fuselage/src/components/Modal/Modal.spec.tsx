import { composeStories } from '@storybook/react';
import { createEvent, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { Modal, ModalFooter } from '.';
import * as stories from './Modal.stories';
import { render } from '../../testing';

const composedStories = composeStories(stories);

const { Default } = composedStories;

const testCases = Object.values(composedStories).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Modal Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('Default should render the dialog a11y compliant', () => {
		render(<Default />);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	test('renders a plain surface without onSubmit', () => {
		render(
			<Modal>
				<ModalFooter>content</ModalFooter>
			</Modal>,
		);
		expect(screen.queryByText('content', { selector: 'form *' })).not.toBeInTheDocument();
		expect(screen.getByText('content', { selector: '.rcx-modal__inner *' })).toBeInTheDocument();
	});

	test('renders the surface as a form that calls onSubmit, with formId', async () => {
		const user = userEvent.setup();
		const onSubmit = jest.fn();
		render(
			<Modal onSubmit={onSubmit} formId='the-form'>
				<button type='submit'>go</button>
			</Modal>,
		);
		const { form } = screen.getByRole<HTMLButtonElement>('button', { name: 'go' });
		expect(form).toHaveClass('rcx-modal__inner');
		expect(form).toHaveAttribute('id', 'the-form');
		await user.click(screen.getByText('go'));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	test('calls onSubmit without the event and prevents the native submission', () => {
		const onSubmit = jest.fn();
		render(
			<Modal onSubmit={onSubmit}>
				<button type='submit'>go</button>
			</Modal>,
		);
		const { form } = screen.getByRole<HTMLButtonElement>('button', { name: 'go' });
		if (!form) {
			throw new Error('The modal should render a form');
		}
		const submit = createEvent.submit(form);
		fireEvent(form, submit);
		expect(submit.defaultPrevented).toBe(true);
		expect(onSubmit).toHaveBeenCalledWith();
	});
});
