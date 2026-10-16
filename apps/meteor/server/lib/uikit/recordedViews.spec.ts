import { recordInteractionView, withRecordedView } from './recordedViews';

const mockSaveView = jest.fn();
const mockFindOneByIdForUser = jest.fn();

jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ debug: jest.fn(), error: jest.fn() })) }));
jest.mock('@rocket.chat/models', () => ({
	UiKitViews: {
		saveView: (...args: unknown[]) => mockSaveView(...args),
		findOneByIdForUser: (...args: unknown[]) => mockFindOneByIdForUser(...args),
	},
}));

const appView = { id: 'view', title: { type: 'plain_text', text: 'Form' }, blocks: [{ type: 'divider' }] };

beforeEach(() => {
	mockSaveView.mockReset();
	mockFindOneByIdForUser.mockReset();
});

describe('recordInteractionView', () => {
	it('records the modal an app opens for a user', async () => {
		await recordInteractionView({ type: 'modal.open', view: appView }, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith({ _id: 'view', appId: 'app', userId: 'user', type: 'modal', view: appView });
	});

	it('merges an update into the recorded view, as the client does', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: appView });

		await recordInteractionView({ type: 'contextual_bar.update', view: { id: 'view', blocks: [] } }, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ type: 'contextual_bar', view: { ...appView, blocks: [] } }));
	});

	it.each([
		['an interaction with no view', { type: 'errors', errors: {} }, 'user'],
		['a banner', { type: 'banner.open', view: { id: 'view' } }, 'user'],
		['a visitor, who has no user id', { type: 'modal.open', view: appView }, undefined],
	])('records nothing for %s', async (_case, interaction, userId) => {
		await recordInteractionView(interaction, 'app', userId);

		expect(mockSaveView).not.toHaveBeenCalled();
	});
});

describe('withRecordedView', () => {
	it('replaces what the client sent with the recorded view, keeping the state the user filled in', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: appView });

		const view = await withRecordedView({ id: 'view', blocks: [{ type: 'forged' }], state: { name: { name: 'Ada' } } }, 'app', 'user');

		expect(mockFindOneByIdForUser).toHaveBeenCalledWith('view', 'app', 'user');
		expect(view).toEqual({ ...appView, state: { name: { name: 'Ada' } } });
	});

	it('passes the client copy on when the server has no record of the view', async () => {
		mockFindOneByIdForUser.mockResolvedValue(null);
		const clientView = { id: 'view', blocks: [], state: {} };

		expect(await withRecordedView(clientView, 'app', 'user')).toBe(clientView);
	});

	it('passes the client copy on when the record cannot be read', async () => {
		mockFindOneByIdForUser.mockRejectedValue(new Error('down'));
		const clientView = { id: 'view', blocks: [], state: {} };

		expect(await withRecordedView(clientView, 'app', 'user')).toBe(clientView);
	});
});
