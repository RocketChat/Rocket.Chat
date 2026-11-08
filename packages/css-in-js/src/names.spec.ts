import { createAnimationName, createClassName, escapeName } from './names';

describe('names', () => {
	describe('createAnimationName', () => {
		it('is injective', () => {
			const content = 'from { opacity: 0; }';
			const alternateContent = 'from { opacity: 0.5 }';

			const nameA = createAnimationName(content);
			const nameB = createAnimationName(content);
			const nameC = createAnimationName(alternateContent);

			expect(nameA).toBe(nameB);
			expect(nameA).not.toBe(nameC);
		});
	});

	describe('createClassName', () => {
		it('is injective', () => {
			const content = 'outline: 0;';
			const alternateContent = 'outline: 1px solid red;';

			const nameA = createClassName(content);
			const nameB = createClassName(content);
			const nameC = createClassName(alternateContent);

			expect(nameA).toBe(nameB);
			expect(nameA).not.toBe(nameC);
		});
	});

	describe('escapeName', () => {
		it('escapes `@`, `#`, and `:` characters', () => {
			expect(escapeName('@a#b:c@d#e:f')).toBe('\\@a\\#b\\:c\\@d\\#e\\:f');
		});
	});
});
