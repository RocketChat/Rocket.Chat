import { iterateMailboxCandidates, resolveMailbox } from './resolveMailboxes';

const findActive = jest.fn();

jest.mock('@rocket.chat/models', () => ({ Users: { findActive: (...args: unknown[]) => findActive(...args) } }));

describe('resolveMailbox', () => {
	it('takes the first verified email', () => {
		const user = {
			_id: 'uid',
			emails: [
				{ address: 'first@corp.example', verified: true },
				{ address: 'second@corp.example', verified: true },
			],
		};

		expect(resolveMailbox(user as never)).toBe('first@corp.example');
	});

	it('ignores unverified addresses', () => {
		const user = {
			_id: 'uid',
			emails: [
				{ address: 'unverified@corp.example', verified: false },
				{ address: 'verified@corp.example', verified: true },
			],
		};

		expect(resolveMailbox(user as never)).toBe('verified@corp.example');
	});

	it('returns nothing when no address is verified', () => {
		const user = { _id: 'uid', emails: [{ address: 'user@corp.example', verified: false }] };

		expect(resolveMailbox(user as never)).toBeUndefined();
	});
});

describe('iterateMailboxCandidates', () => {
	beforeEach(() => jest.clearAllMocks());

	const collect = async (pageSize?: number) => {
		const seen = [];
		for await (const candidate of iterateMailboxCandidates(pageSize)) {
			seen.push(candidate);
		}
		return seen;
	};

	const verified = (id: string) => ({ _id: id, emails: [{ address: `${id}@corp.example`, verified: true }] });

	const pageOf = (users: object[]) => ({ toArray: async () => users });

	it('only asks for users who have a verified mailbox', async () => {
		findActive.mockReturnValue(pageOf([]));

		await collect();

		expect(findActive).toHaveBeenCalledWith(
			expect.objectContaining({
				type: { $nin: ['app', 'bot'] },
				federated: { $ne: true },
				isRemote: { $ne: true },
				roles: { $ne: 'guest' },
				emails: { $elemMatch: { verified: true } },
			}),
			expect.objectContaining({ projection: { emails: 1 }, sort: { _id: 1 } }),
		);
	});

	it('pages by the last id it saw rather than by skipping', async () => {
		findActive.mockReturnValueOnce(pageOf([verified('a'), verified('b')])).mockReturnValueOnce(pageOf([verified('c')]));

		await collect(2);

		expect(findActive.mock.calls[0][0]).not.toHaveProperty('_id');
		expect(findActive.mock.calls[1][0]).toMatchObject({ _id: { $gt: 'b' } });
	});

	it('yields every user across pages, once each', async () => {
		findActive.mockReturnValueOnce(pageOf([verified('a'), verified('b')])).mockReturnValueOnce(pageOf([verified('c')]));

		expect((await collect(2)).map(({ uid }) => uid)).toEqual(['a', 'b', 'c']);
	});

	it('stops on a short page instead of asking for one more', async () => {
		findActive.mockReturnValue(pageOf([verified('a')]));

		await collect(2);

		expect(findActive).toHaveBeenCalledTimes(1);
	});

	it('stops on an empty page when the last full one landed exactly on the boundary', async () => {
		findActive.mockReturnValueOnce(pageOf([verified('a'), verified('b')])).mockReturnValueOnce(pageOf([]));

		expect((await collect(2)).map(({ uid }) => uid)).toEqual(['a', 'b']);
		expect(findActive).toHaveBeenCalledTimes(2);
	});
});
