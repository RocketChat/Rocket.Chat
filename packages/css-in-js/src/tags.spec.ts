import { css, keyframes } from '.';
import { holdContext } from './tags';

describe('tags', () => {
	describe('css', () => {
		it('evaluates as an empty string if the template string is empty', () => {
			expect(css``()).toBe('');
		});

		it('evaluates as an empty string if the template string is filled only with spaces', () => {
			expect(css` \t\r\n`()).toBe('');
		});

		it('evaluates as a trimmed string', () => {
			expect(
				css`
					color: red;
				`(),
			).toBe('color: red;');
		});

		it('interpolates numbers and strings', () => {
			expect(
				css`
					border: ${0};
				`(),
			).toBe('border: 0;');
			expect(
				css`
					color: ${'red'};
				`(),
			).toBe('color: red;');
		});

		it('interpolates array', () => {
			expect(
				css`
					border: ${['1', 'px']};
				`(),
			).toBe('border: 1px;');
		});

		it('evaluates as a string ignoring undefined, null and false as interpolated values', () => {
			expect(
				css`
					color: ${false} ${undefined} ${null};
				`(),
			).toBe('color:   ;');
		});

		it('evaluates as a string if some interpolated value is a function', () => {
			expect(
				css`
					color: ${(): string => 'red'};
				`(),
			).toBe('color: red;');
		});

		it('interpolates functions with args passed', () => {
			expect(
				css`
					color: ${(colorValue: string): string => colorValue};
				`('red'),
			).toBe('color: red;');
		});

		it('interpolates other `css` tagged template strings', () => {
			expect(
				css`
					color: ${css`red`};
				`(),
			).toBe('color: red;');
		});

		it('interpolates `keyframes` tagged template strings', () => {
			expect(
				css`
					animation-name: ${keyframes`
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      `};
				`(),
			).toEqual(expect.stringMatching(/^animation-name: rcx-css-([0-9a-z]+);@keyframes rcx-css-\1{/));
		});

		it('fails safely with invalid arguments', () => {
			const cssUntyped = css as unknown as (...args: any) => (...args: unknown[]) => string;
			expect(cssUntyped()()).toBe('');
			expect(cssUntyped(null)()).toBe('');
			expect(cssUntyped([])()).toBe('');
			expect(cssUntyped([null])()).toBe('');
		});
	});

	describe('keyframes', () => {
		it('evaluates as `none` if the template string is empty', () => {
			expect(keyframes``()).toBe('none');
		});

		it('evaluates as `none` if the template string is filled only with spaces', () => {
			expect(keyframes` \t\r\n`()).toBe('none');
		});

		it('evaluates as a trimmed string', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes` from { opacity: 0; } `();

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity: 0; }}`);
		});

		it('interpolates numbers and strings', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes`from { opacity: ${0}; }`();

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity: 0; }}`);
		});

		it('evaluates as a string ignoring undefined, null and false as interpolated values', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes`from { opacity: ${false} ${undefined} ${null}; }`();

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity:   ; }}`);
		});

		it('evaluates as a string if some interpolated value is a function', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes`from { opacity: ${() => 0}; }`();

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity: 0; }}`);
		});

		it('interpolates functions with args passed', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes`from { opacity: ${(opacityValue: number) => opacityValue}; }`(0.5);

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity: 0.5; }}`);
		});

		it('interpolates `css` tagged template strings', () => {
			const [, freeContext] = holdContext();

			const escapedAnimationName = keyframes`from { ${css`
				opacity: 0;
			`} }`();

			expect(freeContext()).toBe(`@keyframes ${escapedAnimationName}{from { opacity: 0; }}`);
		});

		it('fails safely with invalid arguments', () => {
			const keyframesUntyped = keyframes as unknown as (...args: any) => (...args: unknown[]) => string;
			expect(keyframesUntyped()()).toBe('none');
			expect(keyframesUntyped(null)()).toBe('none');
			expect(keyframesUntyped([])()).toBe('none');
			expect(keyframesUntyped([null])()).toBe('none');
		});
	});
});
