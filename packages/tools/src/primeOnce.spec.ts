import { primeOnce } from './primeOnce';

describe('primeOnce', () => {
	it('should run the initializer only once', async () => {
		const fn = jest.fn().mockResolvedValue('value');
		const prime = primeOnce(fn);

		await expect(prime()).resolves.toBe('value');
		await expect(prime()).resolves.toBe('value');

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should share a single attempt between concurrent callers', async () => {
		const fn = jest.fn().mockResolvedValue('value');
		const prime = primeOnce(fn);

		await expect(Promise.all([prime(), prime(), prime()])).resolves.toEqual(['value', 'value', 'value']);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should reject every concurrent caller when the initializer fails', async () => {
		const fn = jest.fn().mockRejectedValue(new Error('unreachable'));
		const prime = primeOnce(fn);

		await expect(Promise.all([prime(), prime()])).rejects.toThrow('unreachable');

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should try again after a failure', async () => {
		const fn = jest.fn().mockRejectedValueOnce(new Error('unreachable')).mockResolvedValue('value');
		const prime = primeOnce(fn);

		await expect(prime()).rejects.toThrow('unreachable');
		await expect(prime()).resolves.toBe('value');

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('should keep the result once it succeeds', async () => {
		const fn = jest.fn().mockRejectedValueOnce(new Error('unreachable')).mockResolvedValue('value');
		const prime = primeOnce(fn);

		await expect(prime()).rejects.toThrow('unreachable');
		await prime();
		await prime();

		expect(fn).toHaveBeenCalledTimes(2);
	});
});
