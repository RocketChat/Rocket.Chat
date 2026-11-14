import { css } from '@rocket.chat/css-in-js';
import { fireEvent } from '@testing-library/react';

import AnimatedVisibility from './AnimatedVisibility';
import { render } from '../../testing';
import { Box } from '../Box';

const cssClassCount = (element: Element | null) =>
	(element?.className ?? '').split(' ').filter((name) => name.startsWith('rcx-css-')).length;

describe('[AnimatedVisibility Component]', () => {
	it('keeps a string className of the child', () => {
		const { container } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box className='own' />
			</AnimatedVisibility>,
		);

		expect(container.firstElementChild).toHaveClass('own');
		expect(container.firstElementChild).toHaveCssInJsClass();
	});

	it('keeps a css function className of the child', () => {
		const { container } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box
					className={css`
						color: red;
					`}
				/>
			</AnimatedVisibility>,
		);

		expect(container.firstElementChild?.className).not.toMatch(/=>|function/);
		expect(cssClassCount(container.firstElementChild)).toBeGreaterThanOrEqual(2);
	});

	it('keeps an array className of the child', () => {
		const { container } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box
					className={[
						'own',
						css`
							color: red;
						`,
					]}
				/>
			</AnimatedVisibility>,
		);

		expect(container.firstElementChild).toHaveClass('own');
		expect(container.firstElementChild?.className).not.toMatch(/=>|function/);
		expect(cssClassCount(container.firstElementChild)).toBeGreaterThanOrEqual(2);
	});

	it('runs the child onAnimationEnd and still hides once the animation ends', () => {
		const onAnimationEnd = jest.fn();
		const { container, rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-qa='child' onAnimationEnd={onAnimationEnd} />
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box data-qa='child' onAnimationEnd={onAnimationEnd} />
			</AnimatedVisibility>,
		);
		expect(container.firstElementChild).not.toBeNull();

		fireEvent.animationEnd(container.firstElementChild as Element);

		expect(onAnimationEnd).toHaveBeenCalledTimes(1);
		expect(container.firstElementChild).toBeNull();
	});

	it('ignores descendant animationEnd events and hides only on the element itself', () => {
		const onAnimationEnd = jest.fn();
		const { container, rerender } = render(
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Box data-qa='child' onAnimationEnd={onAnimationEnd}>
					<span data-qa='descendant' />
				</Box>
			</AnimatedVisibility>,
		);

		rerender(
			<AnimatedVisibility visibility={AnimatedVisibility.HIDDEN}>
				<Box data-qa='child' onAnimationEnd={onAnimationEnd}>
					<span data-qa='descendant' />
				</Box>
			</AnimatedVisibility>,
		);
		expect(container.firstElementChild).not.toBeNull();

		const descendant = container.querySelector('[data-qa="descendant"]');
		expect(descendant).not.toBeNull();
		fireEvent.animationEnd(descendant as Element);

		expect(container.firstElementChild).not.toBeNull();

		fireEvent.animationEnd(container.firstElementChild as Element);
		expect(onAnimationEnd).toHaveBeenCalled();
		expect(container.firstElementChild).toBeNull();
	});
});
