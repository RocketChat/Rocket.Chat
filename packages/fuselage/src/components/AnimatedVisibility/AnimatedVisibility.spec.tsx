import { fireEvent, screen } from '@testing-library/react';

import AnimatedVisibility from './AnimatedVisibility';
import Box from '../Box';
import { render } from '../../testing';

describe('[AnimatedVisibility Component]', () => {
	it('renders without crashing', () => {
		render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-testid='box'>Content</Box>
			</AnimatedVisibility>,
		);
		expect(screen.getByTestId('box')).toBeInTheDocument();
	});

	it('calls child onAnimationEnd and advances state from HIDING to HIDDEN', () => {
		const handleChildAnimationEnd = jest.fn();
		const { rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-testid='box' onAnimationEnd={handleChildAnimationEnd}>
					Content
				</Box>
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box data-testid='box' onAnimationEnd={handleChildAnimationEnd}>
					Content
				</Box>
			</AnimatedVisibility>,
		);

		const box = screen.getByTestId('box');
		fireEvent.animationEnd(box);

		expect(handleChildAnimationEnd).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId('box')).not.toBeInTheDocument();
	});

	it('ignores bubbled animation events from descendants', () => {
		const handleChildAnimationEnd = jest.fn();
		const { rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-testid='box' onAnimationEnd={handleChildAnimationEnd}>
					<span data-testid='descendant'>Descendant</span>
				</Box>
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box data-testid='box' onAnimationEnd={handleChildAnimationEnd}>
					<span data-testid='descendant'>Descendant</span>
				</Box>
			</AnimatedVisibility>,
		);

		const descendant = screen.getByTestId('descendant');
		fireEvent.animationEnd(descendant);

		expect(handleChildAnimationEnd).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId('box')).toBeInTheDocument();

		const box = screen.getByTestId('box');
		fireEvent.animationEnd(box);

		expect(handleChildAnimationEnd).toHaveBeenCalledTimes(2);
		expect(screen.queryByTestId('box')).not.toBeInTheDocument();
	});
});
