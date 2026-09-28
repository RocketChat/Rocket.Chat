import { capitalize } from './capitalize';

describe('capitalize', () => {
	it('should convert "xyz" to "Xyz"', () => {
		expect(capitalize('xyz')).toBe('Xyz');
	});

	it('should convert "xyz xyz" to "Xyz xyz"', () => {
		expect(capitalize('xyz xyz')).toBe('Xyz xyz');
	});

	it('should convert " xyz" to " xyz"', () => {
		expect(capitalize(' xyz')).toBe(' xyz');
	});

	it('should convert undefined to ""', () => {
		expect(capitalize(undefined as unknown as string)).toBe('');
	});

	it('should convert null to ""', () => {
		expect(capitalize(null as unknown as string)).toBe('');
	});

	it('should convert false to ""', () => {
		expect(capitalize(false as unknown as string)).toBe('');
	});

	it('should convert true to ""', () => {
		expect(capitalize(true as unknown as string)).toBe('');
	});

	it('should convert 0 to ""', () => {
		expect(capitalize(0 as unknown as string)).toBe('');
	});

	it('should convert 1 to ""', () => {
		expect(capitalize(1 as unknown as string)).toBe('');
	});
});
