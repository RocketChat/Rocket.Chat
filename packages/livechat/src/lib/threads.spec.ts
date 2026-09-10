import { normalizeMessages } from './threads';

const mockSetState = jest.fn();

jest.mock('./random', () => ({
	createToken: jest.fn(() => 'token'),
}));

const mockState = {
	messages: [{ _id: 'parent1', msg: 'parent text', attachments: [] }],
	parentMessages: [],
	room: { _id: 'room1' },
	alerts: [],
};

jest.mock('../store', () => ({
	store: {
		get state() {
			return mockState;
		},
		setState: (...args: unknown[]) => mockSetState(...args),
	},
}));

jest.mock('../api', () => ({
	Livechat: {
		message: jest.fn(),
	},
}));

describe('normalizeMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState.messages = [{ _id: 'parent1', msg: 'parent text', attachments: [] }];
		mockState.parentMessages = [];
	});

	it('drops thread parent messages registered via replies', async () => {
		const result = await normalizeMessages([
			{ _id: 'parent1', replies: ['reply1'] },
			{ _id: 'plain1', msg: 'hello' },
		]);

		expect(result.map((message) => message._id)).toEqual(['plain1']);
	});

	it('attaches threadMsg context to replies', async () => {
		const result = await normalizeMessages([{ _id: 'reply1', tmid: 'parent1' }]);

		expect(result).toHaveLength(1);
		expect(result[0].threadMsg).toMatchObject({ _id: 'parent1' });
	});

	it('returns an empty array for no messages', async () => {
		await expect(normalizeMessages([])).resolves.toEqual([]);
		await expect(normalizeMessages()).resolves.toEqual([]);
	});
});
