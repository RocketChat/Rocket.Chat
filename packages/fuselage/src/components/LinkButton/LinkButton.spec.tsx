import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LinkButton from './LinkButton';
import * as stories from './LinkButton.stories';
import { render } from '../../testing';

const { Default, InSentence } = composeStories(stories);

describe('[LinkButton Component]', () => {
	it('renders a button that does not submit a form', () => {
		render(<Default />);
		expect(screen.getByRole('button', { name: 'Resend' })).toHaveAttribute('type', 'button');
	});

	it('runs its action from the keyboard', async () => {
		const onClick = jest.fn();
		render(<LinkButton onClick={onClick}>Resend</LinkButton>);

		await userEvent.tab();
		expect(screen.getByRole('button', { name: 'Resend' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('keeps the class it is given', () => {
		render(<LinkButton className='extra'>Resend</LinkButton>);
		expect(screen.getByRole('button', { name: 'Resend' })).toHaveClass('rcx-link-button', 'extra');
	});

	it('reads as part of the sentence around it', () => {
		render(<InSentence />);
		expect(screen.getByRole('button', { name: 'change email' })).toBeInTheDocument();
		expect(screen.getByRole('paragraph')).toHaveTextContent("Didn't receive email? Resend or change email");
	});
});
