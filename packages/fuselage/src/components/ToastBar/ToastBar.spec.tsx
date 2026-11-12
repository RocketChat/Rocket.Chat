import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import ToastBar from './ToastBar';
import * as stories from './ToastBar.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[ToastBar Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[ToastBar Roles]', () => {
	it('should use role="status" for `info` variant (polite announcement)', () => {
		const { getByRole } = render(<ToastBar variant='info'>Info message</ToastBar>);
		expect(getByRole('status')).toBeInTheDocument();
		expect(getByRole('status')).toHaveTextContent('Info message');
	});

	it('should use role="status" for `success` variant (polite announcement)', () => {
		const { getByRole } = render(<ToastBar variant='success'>Success message</ToastBar>);
		expect(getByRole('status')).toBeInTheDocument();
		expect(getByRole('status')).toHaveTextContent('Success message');
	});

	it('should use role="alert" for `error` variant (assertive announcement)', () => {
		const { getByRole } = render(<ToastBar variant='error'>Error message</ToastBar>);
		expect(getByRole('alert')).toBeInTheDocument();
		expect(getByRole('alert')).toHaveTextContent('Error message');
	});

	it('should default to role="status" when no variant is specified', () => {
		const { getByRole } = render(<ToastBar>Default message</ToastBar>);
		expect(getByRole('status')).toBeInTheDocument();
		expect(getByRole('status')).toHaveTextContent('Default message');
	});
});

describe('[ToastBar time]', () => {
	it('hands the progress bar its duration', () => {
		const { container } = render(<ToastBar time={3}>Message</ToastBar>);
		expect(container.querySelector<HTMLElement>('.rcx-toastbar_progressbar')?.style.getPropertyValue('--rcx-toastbar-time')).toBe('3s');
	});

	it('pauses the progress bar through its class', () => {
		const { container } = render(
			<ToastBar time={3} isPaused>
				Message
			</ToastBar>,
		);
		expect(container.querySelector('.rcx-toastbar_progressbar')).toHaveClass('rcx-toastbar_progressbar--paused');
	});
});

describe('[ToastBar id]', () => {
	it('renders the id it receives on the root', () => {
		const { container } = render(<ToastBar id='toast-1'>Message</ToastBar>);
		expect(container.querySelector('#toast-1.rcx-toastbar')).toBeInTheDocument();
	});
});
