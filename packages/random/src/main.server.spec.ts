import { Random } from './main.server';

it('which should generate the same sequence in all environments', () => {
	const random = Random.createWithSeeds(0);

	expect(random.id()).toBe('cp9hWvhg8GSvuZ9os');
	expect(random.id()).toBe('3f3k6Xo7rrHCifQhR');
	expect(random.id()).toBe('shxDnjWWmnKPEoLhM');
	expect(random.id()).toBe('6QTjB8C5SEqhmz4ni');
});

describe('format', () => {
	it('should output id in the right format', () => {
		expect(Random.id(17)).toHaveLength(17);
		expect(Random.id(29)).toHaveLength(29);
	});

	it('should output hexString in the right format', () => {
		const hexString = Random.hexString(9);
		expect(hexString).toHaveLength(9);
		expect(Number.parseInt(hexString, 16)).not.toBeNaN();
	});

	it('should output fraction in the right range', () => {
		const frac = Random.fraction();
		expect(frac).toBeLessThan(1.0);
		expect(frac).toBeGreaterThanOrEqual(0.0);
	});

	it('should output secret in the right format', () => {
		expect(Random.secret().length).toBe(43);
		expect(Random.secret(13).length).toBe(13);
	});
});

describe('Alea', () => {
	it('should be undefined', () => {
		expect(Random).not.toHaveProperty('alea');
	});
});

describe('createWithSeeds', () => {
	it('should throw if no seeds are provided', () => {
		expect(() => Random.createWithSeeds()).toThrow();
	});
});
