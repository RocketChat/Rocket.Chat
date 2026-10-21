import { composeStories } from '@storybook/react-webpack5';
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
