import { UIKitInteractionType, triggerAction } from './uiKit';

const mockSendUiInteraction = jest.fn();
const mockSetState = jest.fn();

jest.mock('../api', () => ({ Livechat: { sendUiInteraction: (...args: unknown[]) => mockSendUiInteraction(...args) } }));
jest.mock('../store', () => ({ __esModule: true, default: { setState: (...args: unknown[]) => mockSetState(...args) } }));
let nextId = 0;
jest.mock('./random', () => ({ createRandomId: () => `trigger-${nextId++}` }));
jest.mock('../components/uiKit/modal', () => ({ UiKitModal: () => null }));

const view = { id: 'view-1', title: { type: 'plain_text', text: 'T' }, blocks: [] };

const respond = (response: Record<string, unknown>) =>
	mockSendUiInteraction.mockImplementationOnce(async ({ triggerId }) => ({ ...response, triggerId }));

const trigger = () => triggerAction({ appId: 'app', type: 'blockAction', actionId: 'a' });

const lastModalProps = () => mockSetState.mock.calls.at(-1)?.[0].modal.props;

beforeEach(() => {
	jest.clearAllMocks();
});

describe('app responses to a visitor interaction', () => {
	it('opens a modal when the app answers modal.open', async () => {
		respond({ type: UIKitInteractionType.MODAL_OPEN, view });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_OPEN);
		expect(lastModalProps()).toMatchObject({ appId: 'app', view });
	});

	it('replaces the open modal when the app answers modal.update', async () => {
		respond({ type: UIKitInteractionType.MODAL_UPDATE, view: { id: 'view-1', title: { type: 'plain_text', text: 'New' } } });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_UPDATE);
		expect(lastModalProps().view).toMatchObject({ id: 'view-1', title: { text: 'New' }, blocks: [] });
	});

	it('hands the errors to the open modal', async () => {
		respond({ type: UIKitInteractionType.ERRORS, viewId: 'view-1', errors: { field: 'Required' } });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.ERRORS);
		expect(lastModalProps().errors).toEqual({ field: 'Required' });
	});

	it('closes the modal when the app answers modal.close', async () => {
		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-1' });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_CLOSE);
		expect(mockSetState).toHaveBeenLastCalledWith({ modal: null });
	});

	it('ignores an answer whose trigger id it did not issue', async () => {
		mockSendUiInteraction.mockResolvedValueOnce({ type: UIKitInteractionType.MODAL_OPEN, view, triggerId: 'unknown' });

		await expect(trigger()).resolves.toBeUndefined();
		expect(mockSetState).not.toHaveBeenCalled();
	});
});

describe('the modal a visitor sees', () => {
	beforeEach(async () => {
		respond({ type: UIKitInteractionType.MODAL_OPEN, view });
		await trigger();
		mockSendUiInteraction.mockImplementationOnce(async ({ triggerId }) => ({ triggerId }));
	});

	it('sends viewSubmit with the view state and closes when the app has nothing more to show', async () => {
		const { onSubmit } = lastModalProps();
		mockSetState.mockClear();

		await onSubmit({ b: { e: 'v' } });

		expect(mockSendUiInteraction).toHaveBeenLastCalledWith(
			expect.objectContaining({ type: 'viewSubmit', viewId: 'view-1', payload: expect.objectContaining({ state: { b: { e: 'v' } } }) }),
			'app',
		);
		expect(mockSetState).toHaveBeenLastCalledWith({ modal: null });
	});

	it('sends viewClosed when the visitor dismisses it', async () => {
		await lastModalProps().onClose({});

		expect(mockSendUiInteraction).toHaveBeenLastCalledWith(
			expect.objectContaining({ type: 'viewClosed', payload: expect.objectContaining({ isCleared: false }) }),
			'app',
		);
	});
});
