import { css } from '@rocket.chat/css-in-js';

import Box from './Box';
import { render } from '../../testing';

describe('[Box Component]', () => {
	it('renders without crashing', () => {
		render(<Box />);
	});

	describe('className prop', () => {
		it('accepts a string in className prop', () => {
			const { container } = render(<Box className='fuselage' />);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toBeInstanceOf(HTMLDivElement);
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('fuselage');
		});

		it('accepts a css tagged template string in className prop', () => {
			const { container } = render(
				<Box
					className={css`
						width: 10em;
					`}
				/>,
			);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveCssInJsClass();
			expect(container.firstElementChild).toHaveStyle({
				width: '10em',
			});
		});

		it('accepts an empty array in className prop', () => {
			const { container } = render(<Box className={[]} />);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
		});

		it('accepts an array of values in className prop', () => {
			const { container } = render(
				<Box
					className={[
						'fuselage',
						css`
							width: 10em;
						`,
					]}
				/>,
			);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('fuselage');
			expect(container.firstElementChild).toHaveCssInJsClass();
			expect(container.firstElementChild).toHaveStyle({
				width: '10em',
			});
		});

		it('attaches rcx-* props into className', () => {
			const { container } = render(<Box rcx-test-a rcx-test-b={false} rcx-test-c={true} rcx-test='d' />);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('rcx-test-a');
			expect(container.firstElementChild).not.toHaveClass('rcx-test-b');
			expect(container.firstElementChild).toHaveClass('rcx-test-c');
			expect(container.firstElementChild).toHaveClass('rcx-test-d');
		});

		it('merges rcx-* props and an empty array into className', () => {
			const { container } = render(<Box className={[]} rcx-test-a rcx-test-b={false} rcx-test-c={true} rcx-test='d' />);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('rcx-test-a');
			expect(container.firstElementChild).not.toHaveClass('rcx-test-b');
			expect(container.firstElementChild).toHaveClass('rcx-test-c');
			expect(container.firstElementChild).toHaveClass('rcx-test-d');
		});

		it('merges rcx-* props and an array of values into className', () => {
			const { container } = render(
				<Box
					className={[
						'fuselage',
						css`
							width: 10em;
						`,
					]}
					rcx-test-a
					rcx-test-b={false}
					rcx-test-c={true}
					rcx-test='d'
				/>,
			);

			expect(container.firstElementChild).toHaveProperty('tagName', 'DIV');
			expect(container.firstElementChild).toHaveClass('rcx-box');
			expect(container.firstElementChild).toHaveClass('rcx-test-a');
			expect(container.firstElementChild).not.toHaveClass('rcx-test-b');
			expect(container.firstElementChild).toHaveClass('rcx-test-c');
			expect(container.firstElementChild).toHaveClass('rcx-test-d');
			expect(container.firstElementChild).toHaveClass('fuselage');
			expect(container.firstElementChild).toHaveCssInJsClass();
			expect(container.firstElementChild).toHaveStyle({
				width: '10em',
			});
		});
	});

	describe('is props', () => {
		it('accepts a instrinsic HTML element', () => {
			const { container } = render(<Box is='span' />);

			expect(container.firstElementChild).toHaveProperty('tagName', 'SPAN');
		});

		it('accepts a instrinsic SVG element', () => {
			const { container } = render(<Box is='path' />, {
				wrapper: ({ children }) => <svg>{children}</svg>,
			});

			expect(container.firstElementChild?.firstElementChild).toHaveProperty(
				'tagName',
				'path', // tagName is lowercase for SVG elements
			);
		});
	});
});
