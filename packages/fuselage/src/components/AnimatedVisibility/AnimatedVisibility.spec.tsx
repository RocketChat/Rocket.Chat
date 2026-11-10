import { css } from '@rocket.chat/css-in-js';

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
});
