import { ServiceStarter } from '../src/lib/ServiceStarter';

const wait = (time: number) => {
	return new Promise((resolve) => {
		setTimeout(() => resolve(undefined), time);
	});
};

describe('ServiceStarter', () => {
	it('should call the starterFn and stopperFn when calling .start and .stop', async () => {
		const start = jest.fn();
		const stop = jest.fn();

		const instance = new ServiceStarter(start, stop);

		expect(start).not.toHaveBeenCalled();
		expect(stop).not.toHaveBeenCalled();

		await instance.start();

		expect(start).toHaveBeenCalled();
		expect(stop).not.toHaveBeenCalled();

		start.mockReset();

		await instance.stop();

		expect(start).not.toHaveBeenCalled();
		expect(stop).toHaveBeenCalled();
	});

	it('should only call .start for the second time after the initial call has finished running', async () => {
		let running = false;
		const start = jest.fn(async () => {
			expect(running).toBe(false);

			running = true;
			await wait(100);
			running = false;
		});
		const stop = jest.fn();

		const instance = new ServiceStarter(start, stop);

		void instance.start();
		void instance.start();

		await instance.wait();

		expect(start).toHaveBeenCalledTimes(2);
		expect(stop).not.toHaveBeenCalled();
	});

	it('should chain up to two calls to .start', async () => {
		const start = jest.fn(async () => {
			await wait(100);
		});
		const stop = jest.fn();

		const instance = new ServiceStarter(start, stop);

		void instance.start();
		void instance.start();
		void instance.start();
		void instance.start();

		await instance.wait();

		expect(start).toHaveBeenCalledTimes(2);
		expect(stop).not.toHaveBeenCalled();
	});

	it('should skip the chained calls to .start if .stop is called', async () => {
		const start = jest.fn(async () => {
			await wait(100);
		});
		const stop = jest.fn();

		const instance = new ServiceStarter(start, stop);

		void instance.start();
		void instance.start();
		void instance.start();
		void instance.stop();

		await instance.wait();

		expect(start).toHaveBeenCalledTimes(1);
		expect(stop).toHaveBeenCalledTimes(1);
	});
});
