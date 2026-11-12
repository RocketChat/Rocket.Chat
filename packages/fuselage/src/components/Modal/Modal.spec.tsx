import { composeStories } from '@storybook/react';
import { fireEvent, screen } from '@testing-library/react';
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
		const { container } = render(
			<Modal>
				<ModalFooter>content</ModalFooter>
			</Modal>,
		);
		expect(container.querySelector('form')).toBeNull();
		expect(container.querySelector('.rcx-modal__inner')).toHaveTextContent('content');
	});

	test('renders the surface as a form that calls onSubmit, with formId', () => {
		const onSubmit = jest.fn((event) => event.preventDefault());
		const { container } = render(
			<Modal onSubmit={onSubmit} formId='the-form'>
				<button type='submit'>go</button>
			</Modal>,
		);
		const form = container.querySelector('form.rcx-modal__inner');
		expect(form).toHaveAttribute('id', 'the-form');
		fireEvent.click(screen.getByText('go'));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});
});
