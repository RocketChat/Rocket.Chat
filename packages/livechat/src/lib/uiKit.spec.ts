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

const open = async (opened = view) => {
	respond({ type: UIKitInteractionType.MODAL_OPEN, view: opened });
	await trigger();
};

const lastModalProps = () => mockSetState.mock.calls.at(-1)?.[0].modal.props;

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(async () => {
	for (const viewId of ['view-1', 'view-2']) {
		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId });
		await trigger();
	}
});

describe('app responses to a visitor interaction', () => {
	it('opens a modal when the app answers modal.open', async () => {
		respond({ type: UIKitInteractionType.MODAL_OPEN, view });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_OPEN);
		expect(lastModalProps()).toMatchObject({ appId: 'app', view });
	});

	it('replaces the open modal when the app answers modal.update', async () => {
		await open();
		respond({ type: UIKitInteractionType.MODAL_UPDATE, view: { id: 'view-1', title: { type: 'plain_text', text: 'New' } } });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_UPDATE);
		expect(lastModalProps().view).toMatchObject({ id: 'view-1', title: { text: 'New' }, blocks: [] });
	});

	it('hands the errors to the open modal', async () => {
		await open();
		respond({ type: UIKitInteractionType.ERRORS, viewId: 'view-1', errors: { field: 'Required' } });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.ERRORS);
		expect(lastModalProps().errors).toEqual({ field: 'Required' });
	});

	it('closes the modal when the app answers modal.close', async () => {
		await open();
		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-1' });

		await expect(trigger()).resolves.toBe(UIKitInteractionType.MODAL_CLOSE);
		expect(mockSetState).toHaveBeenLastCalledWith({ modal: null });
	});

	it('keeps the displayed modal when the app closes a view it covered', async () => {
		await open();
		respond({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });
		await trigger();
		mockSetState.mockClear();

		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-1' });
		await trigger();

		expect(mockSetState).not.toHaveBeenCalled();
	});

	it('ignores an answer whose trigger id it did not issue', async () => {
		mockSendUiInteraction.mockResolvedValueOnce({ type: UIKitInteractionType.MODAL_OPEN, view, triggerId: 'unknown' });

		await expect(trigger()).resolves.toBeUndefined();
		expect(mockSetState).not.toHaveBeenCalled();
	});
});

describe('the modal a visitor sees', () => {
	beforeEach(async () => {
		await open();
		mockSendUiInteraction.mockImplementationOnce(async ({ triggerId }) => ({ triggerId }));
	});

	it('sends viewSubmit with the view state and closes when the app has nothing more to show', async () => {
		const { onSubmit } = lastModalProps();
		mockSetState.mockClear();

		await onSubmit({ b: { e: 'v' } });

		expect(mockSendUiInteraction).toHaveBeenLastCalledWith(
			expect.objectContaining({
				type: 'viewSubmit',
				viewId: 'view-1',
				payload: { view: expect.objectContaining({ state: { b: { e: 'v' } } }) },
			}),
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

describe('the modal stack', () => {
	const interact = async (response: Record<string, unknown>) => {
		respond(response);
		await trigger();
	};

	it('shows a pushed view over the open one and reveals the open one when it closes', async () => {
		await open();
		await interact({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });
		expect(lastModalProps().view.id).toBe('view-2');

		await interact({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-2' });
		expect(lastModalProps().view.id).toBe('view-1');
	});

	it('closes every view when the app answers modal.clear', async () => {
		await open();
		await interact({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });

		await interact({ type: UIKitInteractionType.MODAL_CLEAR });
		expect(mockSetState).toHaveBeenLastCalledWith({ modal: null });
	});

	it('replaces the stack when the app answers modal.open', async () => {
		await open();
		await interact({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });
		await open({ ...view, id: 'view-3' });
		await interact({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-3' });

		expect(mockSetState).toHaveBeenLastCalledWith({ modal: null });
	});

	it('keeps a covered view covered when an update or errors for it arrive late', async () => {
		await open();
		await interact({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });
		mockSetState.mockClear();

		await interact({ type: UIKitInteractionType.MODAL_UPDATE, view: { id: 'view-1', title: { type: 'plain_text', text: 'New' } } });
		await interact({ type: UIKitInteractionType.ERRORS, viewId: 'view-1', errors: { a: 'x' } });
		expect(mockSetState).not.toHaveBeenCalled();

		await interact({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-2' });
		expect(lastModalProps()).toMatchObject({ view: { title: { text: 'New' } }, errors: { a: 'x' } });
	});
});

describe('the modal stack limit and submit answers', () => {
	const push = async (id: string) => {
		respond({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id } });
		await trigger();
	};

	afterEach(async () => {
		for (const viewId of ['view-3', 'view-4']) {
			respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId });
			await trigger();
		}
	});

	it('drops the top view of an app that pushes past three views', async () => {
		await open();
		await push('view-2');
		await push('view-3');
		await push('view-4');

		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-4' });
		await trigger();

		expect(lastModalProps().view.id).toBe('view-2');
	});

	it('keeps the submitting view under the view the app pushes', async () => {
		await open();
		const { onSubmit } = lastModalProps();
		respond({ type: UIKitInteractionType.MODAL_PUSH, view: { ...view, id: 'view-2' } });
		await onSubmit({});
		expect(lastModalProps().view.id).toBe('view-2');

		respond({ type: UIKitInteractionType.MODAL_CLOSE, viewId: 'view-2' });
		await trigger();

		expect(lastModalProps().view.id).toBe('view-1');
	});
});
