import { EwsTransportPool } from './EwsTransportPool';

type Pending = { resolve: (body: string) => void; reject: (err: Error) => void };

const createConnections = (count: number) => {
	const pending: Pending[][] = Array.from({ length: count }, () => []);
	const connections = pending.map((queue) => ({
		post: jest.fn(
			() =>
				new Promise<string>((resolve, reject) => {
					queue.push({ resolve, reject });
				}),
		),
	}));

	let next = 0;
	const pool = new EwsTransportPool(count, () => connections[next++]);

	return { pool, connections, pending };
};

describe('EwsTransportPool', () => {
	it('builds as many connections as it is asked for', () => {
		const createConnection = jest.fn(() => ({ post: jest.fn() }));

		new EwsTransportPool(3, createConnection);

		expect(createConnection).toHaveBeenCalledTimes(3);
	});

	it('sends a request to an idle connection instead of queueing it behind a busy one', () => {
		const { pool, connections } = createConnections(3);

		void pool.post('a');
		void pool.post('b');
		void pool.post('c');

		expect(connections.map(({ post }) => post.mock.calls)).toEqual([[['a']], [['b']], [['c']]]);
	});

	it('queues on the least busy connection once all of them are in use', async () => {
		const { pool, connections, pending } = createConnections(2);

		void pool.post('a');
		const b = pool.post('b');
		void pool.post('c');
		pending[1][0].resolve('');
		await b;
		void pool.post('d');

		expect(connections[0].post.mock.calls).toEqual([['a'], ['c']]);
		expect(connections[1].post.mock.calls).toEqual([['b'], ['d']]);
	});

	it('keeps reusing the first connection while requests come one at a time', async () => {
		const { pool, connections, pending } = createConnections(3);

		const first = pool.post('a');
		pending[0][0].resolve('first');
		await first;
		const second = pool.post('b');
		pending[0][1].resolve('second');

		await expect(second).resolves.toBe('second');
		expect(connections[1].post).not.toHaveBeenCalled();
		expect(connections[2].post).not.toHaveBeenCalled();
	});

	it('frees a connection whose request failed', async () => {
		const { pool, connections, pending } = createConnections(2);

		const failed = pool.post('a');
		pending[0][0].reject(new Error('boom'));
		await expect(failed).rejects.toThrow('boom');

		void pool.post('b');

		expect(connections[0].post).toHaveBeenLastCalledWith('b');
		expect(connections[1].post).not.toHaveBeenCalled();
	});
});
