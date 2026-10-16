import { reportInvalidBlocks, reportInvalidInteractionBlocks } from './reportInvalidBlocks';

const mockWarn = jest.fn();
const mockValidateLayoutBlocks = jest.fn();

jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ warn: (...args: unknown[]) => mockWarn(...args) })) }));
jest.mock(
	'@rocket.chat/ui-kit/dist/blocks/validateLayoutBlocks',
	() => ({ validateLayoutBlocks: (blocks: unknown) => mockValidateLayoutBlocks(blocks) }),
	{
		virtual: true,
	},
);

const error = (index: number) => ({ path: `$input[${index}].type`, expected: 'string' });

beforeEach(() => {
	mockWarn.mockClear();
	mockValidateLayoutBlocks.mockReset();
});

it('logs nothing for a message without blocks or with valid blocks', () => {
	mockValidateLayoutBlocks.mockReturnValue([]);

	reportInvalidBlocks(undefined, { where: 'message' });
	reportInvalidBlocks([{ type: 'divider' }], { where: 'message' });

	expect(mockValidateLayoutBlocks).toHaveBeenCalledTimes(1);
	expect(mockWarn).not.toHaveBeenCalled();
});

it('logs where invalid blocks came from, with the first ten errors and their count', () => {
	mockValidateLayoutBlocks.mockReturnValue(Array.from({ length: 12 }, (_, index) => error(index)));

	reportInvalidBlocks([{}], { where: 'message', rid: 'GENERAL', userId: 'user' });

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

it('checks the blocks of the view an interaction opens, and ignores interactions without a view', () => {
	mockValidateLayoutBlocks.mockReturnValue([error(0)]);

	reportInvalidInteractionBlocks({ type: 'errors', errors: {} }, { where: 'ui.interaction', appId: 'app' });
	reportInvalidInteractionBlocks({ type: 'modal.open', view: { blocks: [{}] } }, { where: 'ui.interaction', appId: 'app' });

	expect(mockValidateLayoutBlocks).toHaveBeenCalledTimes(1);
	expect(mockWarn).toHaveBeenCalledWith(expect.objectContaining({ where: 'ui.interaction', appId: 'app' }));
});
