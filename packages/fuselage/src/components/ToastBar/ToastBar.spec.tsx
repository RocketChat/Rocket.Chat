import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import ToastBar from './ToastBar';
import * as stories from './ToastBar.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[ToastBar Rendering]', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const tree = render(<Story />);
		expect(tree.baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[ToastBar Roles]', () => {
	it('should use role="status" for `info` variant (polite announcement)', () => {
		render(<ToastBar variant='info'>Info message</ToastBar>);
		expect(screen.getByRole('status')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Info message');
	});

	it('should use role="status" for `success` variant (polite announcement)', () => {
		render(<ToastBar variant='success'>Success message</ToastBar>);
		expect(screen.getByRole('status')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Success message');
	});

	it('should use role="alert" for `error` variant (assertive announcement)', () => {
		render(<ToastBar variant='error'>Error message</ToastBar>);
		expect(screen.getByRole('alert')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Error message');
	});

	it('should default to role="status" when no variant is specified', () => {
		render(<ToastBar>Default message</ToastBar>);
		expect(screen.getByRole('status')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Default message');
	});
});
