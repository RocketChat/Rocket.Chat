import { fireEvent, screen } from '@testing-library/react';

import AnimatedVisibility from './AnimatedVisibility';
import { render } from '../../testing';
import { Box } from '../Box';

describe('[AnimatedVisibility Component]', () => {
	it('renders nothing while hidden', () => {
		render(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);

		expect(screen.queryByText('Content')).not.toBeInTheDocument();
	});

	it('unmounts a Box child once its hiding animation ends', () => {
		const { rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);

		const content = screen.getByText('Content');
		expect(content).toHaveCssInJsClass();

		fireEvent.animationEnd(content);

		expect(screen.queryByText('Content')).not.toBeInTheDocument();
	});

	it('mounts a Box child again when it becomes visible after hiding', () => {
		const { rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);
		fireEvent.animationEnd(screen.getByText('Content'));

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box>Content</Box>
			</AnimatedVisibility>,
		);

		const content = screen.getByText('Content');
		fireEvent.animationEnd(content);

		expect(content).toBeInTheDocument();
	});
});
