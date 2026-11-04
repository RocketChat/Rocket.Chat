import { reportInvalidBlocks, reportInvalidInteractionBlocks } from './reportInvalidBlocks';

const mockWarn = jest.fn();
const mockValidateLayoutBlocks = jest.fn();
const mockSettingsGet = jest.fn();

jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ warn: (...args: unknown[]) => mockWarn(...args) })) }));
jest.mock(
	'@rocket.chat/ui-kit/validateLayoutBlocks',
	() => ({
		maxBlocksPerMessage: 50,
		maxBlocksPerView: 100,
		validateLayoutBlocks: (blocks: unknown, maxBlocks: number) => mockValidateLayoutBlocks(blocks, maxBlocks),
	}),
	{
		virtual: true,
	},
);
jest.mock('../../settings', () => ({ settings: { get: (id: string) => mockSettingsGet(id) } }));

const error = (index: number) => ({ path: `$input[${index}].type`, expected: 'string' });

beforeEach(() => {
	mockWarn.mockClear();
	mockValidateLayoutBlocks.mockReset();
	mockSettingsGet.mockReset();
});

describe('with rejection off', () => {
	it('logs nothing for a message without blocks or with valid blocks', () => {
		mockValidateLayoutBlocks.mockReturnValue([]);

		reportInvalidBlocks(undefined, { where: 'message' });
		reportInvalidBlocks([{ type: 'divider' }], { where: 'message' });

		expect(mockValidateLayoutBlocks).toHaveBeenCalledTimes(1);
		expect(mockWarn).not.toHaveBeenCalled();
	});

	it('logs where invalid blocks came from, with the first ten errors and their count, and lets the message through', () => {
		mockValidateLayoutBlocks.mockReturnValue(Array.from({ length: 12 }, (_, index) => error(index)));

		expect(() => reportInvalidBlocks([{}], { where: 'message', rid: 'GENERAL', userId: 'user' })).not.toThrow();

		expect(mockWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				where: 'message',
				rid: 'GENERAL',
				userId: 'user',
				errorCount: 12,
				errors: expect.arrayContaining([error(0)]),
			}),
		);
		expect(mockWarn.mock.calls[0][0].errors).toHaveLength(10);
	});

	it('checks the blocks of the view an interaction opens against the view limit, and keeps the interaction', () => {
		mockValidateLayoutBlocks.mockReturnValue([error(0)]);

		expect(reportInvalidInteractionBlocks({ type: 'errors', errors: {} }, { where: 'ui.interaction', appId: 'app' })).toBe(false);
		expect(reportInvalidInteractionBlocks({ type: 'modal.open', view: { blocks: [{}] } }, { where: 'ui.interaction', appId: 'app' })).toBe(
			false,
		);

		expect(mockValidateLayoutBlocks).toHaveBeenCalledTimes(1);
		expect(mockValidateLayoutBlocks).toHaveBeenCalledWith([{}], 100);
		expect(mockWarn).toHaveBeenCalledWith(expect.objectContaining({ where: 'ui.interaction', appId: 'app' }));
	});
});

describe('with rejection on', () => {
	beforeEach(() => {
		mockSettingsGet.mockImplementation((id: string) => id === 'UiKit_Reject_Invalid_Blocks');
	});

	it('throws error-invalid-blocks for a message with invalid blocks, after logging it, and checks the message limit', () => {
		mockValidateLayoutBlocks.mockReturnValue([error(0)]);

		expect(() => reportInvalidBlocks([{}], { where: 'message' })).toThrow(expect.objectContaining({ error: 'error-invalid-blocks' }));

		expect(mockValidateLayoutBlocks).toHaveBeenCalledWith([{}], 50);
		expect(mockWarn).toHaveBeenCalledTimes(1);
	});

	it('lets a message with valid blocks through', () => {
		mockValidateLayoutBlocks.mockReturnValue([]);

		expect(() => reportInvalidBlocks([{ type: 'divider' }], { where: 'message' })).not.toThrow();
	});

	it('drops an interaction whose view has invalid blocks and keeps the others', () => {
		mockValidateLayoutBlocks.mockReturnValueOnce([error(0)]).mockReturnValueOnce([]);

		expect(reportInvalidInteractionBlocks({ view: { blocks: [{}] } }, { where: 'ui.interaction' })).toBe(true);
		expect(reportInvalidInteractionBlocks({ view: { blocks: [] } }, { where: 'ui.interaction' })).toBe(false);
		expect(reportInvalidInteractionBlocks({ type: 'errors' }, { where: 'ui.interaction' })).toBe(false);
	});
});
