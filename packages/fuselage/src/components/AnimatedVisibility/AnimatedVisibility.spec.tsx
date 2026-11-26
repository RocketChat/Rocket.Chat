import { css } from '@rocket.chat/css-in-js';
import { fireEvent, screen } from '@testing-library/react';

import AnimatedVisibility from './AnimatedVisibility';
import { render } from '../../testing';
import { Box } from '../Box';

const cssClassCount = (element: Element | null) =>
	(element?.className ?? '').split(' ').filter((name) => name.startsWith('rcx-css-')).length;

describe('[AnimatedVisibility Component]', () => {
	it('keeps a string className of the child', () => {
		render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-testid='child' className='own' />
			</AnimatedVisibility>,
		);

		expect(screen.getByTestId('child')).toHaveClass('own');
		expect(screen.getByTestId('child')).toHaveCssInJsClass();
	});

	it('keeps a css function className of the child', () => {
		render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box
					data-testid='child'
					className={css`
						color: red;
					`}
				/>
			</AnimatedVisibility>,
		);

		expect(screen.getByTestId('child').className).not.toMatch(/=>|function/);
		expect(cssClassCount(screen.getByTestId('child'))).toBeGreaterThanOrEqual(2);
	});

	it('keeps an array className of the child', () => {
		render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box
					data-testid='child'
					className={[
						'own',
						css`
							color: red;
						`,
					]}
				/>
			</AnimatedVisibility>,
		);

		expect(screen.getByTestId('child')).toHaveClass('own');
		expect(screen.getByTestId('child').className).not.toMatch(/=>|function/);
		expect(cssClassCount(screen.getByTestId('child'))).toBeGreaterThanOrEqual(2);
	});

	it('runs the child onAnimationEnd and still hides once the animation ends', () => {
		const onAnimationEnd = jest.fn();
		const { rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-testid='child' onAnimationEnd={onAnimationEnd} />
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box data-testid='child' onAnimationEnd={onAnimationEnd} />
			</AnimatedVisibility>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();

		fireEvent.animationEnd(screen.getByTestId('child'));

		expect(onAnimationEnd).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId('child')).not.toBeInTheDocument();
	});
});
