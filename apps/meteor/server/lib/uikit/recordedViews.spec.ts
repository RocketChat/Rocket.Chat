import { recordInteractionView, withRecordedView } from './recordedViews';

const mockSaveView = jest.fn();
const mockFindOneByIdForUser = jest.fn();
const mockFindOneByExternalIdForUser = jest.fn();

jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ debug: jest.fn(), error: jest.fn(), warn: jest.fn() })) }));
jest.mock('@rocket.chat/random', () => ({ Random: { id: () => 'new-hash' } }));
jest.mock('@rocket.chat/models', () => ({
	UiKitViews: {
		saveView: (...args: unknown[]) => mockSaveView(...args),
		findOneByIdForUser: (...args: unknown[]) => mockFindOneByIdForUser(...args),
		findOneByExternalIdForUser: (...args: unknown[]) => mockFindOneByExternalIdForUser(...args),
	},
}));

const appView = { id: 'view', title: { type: 'plain_text', text: 'Form' }, blocks: [{ type: 'divider' }] };

beforeEach(() => {
	mockSaveView.mockReset();
	mockFindOneByIdForUser.mockReset();
	mockFindOneByExternalIdForUser.mockReset();
});

describe('recordInteractionView', () => {
	it('records the modal an app opens for a user', async () => {
		await recordInteractionView({ type: 'modal.open', view: { ...appView } }, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith({
			_id: 'view',
			appId: 'app',
			userId: 'user',
			type: 'modal',
			view: { ...appView, hash: 'new-hash' },
		});
	});

	it('records a pushed modal and returns the new hash in the view the user gets', async () => {
		const interaction = { type: 'modal.push', view: { ...appView } };

		await recordInteractionView(interaction, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ type: 'modal' }));
		expect(interaction.view).toHaveProperty('hash', 'new-hash');
	});

	it('records the metadata the app sets', async () => {
		await recordInteractionView({ type: 'modal.open', view: { ...appView, private_metadata: 'step=1', external_id: 'x' } }, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(
			expect.objectContaining({ view: expect.objectContaining({ private_metadata: 'step=1', external_id: 'x' }) }),
		);
	});

	it('updates the view found by external_id, whatever id the update carries', async () => {
		mockFindOneByIdForUser.mockResolvedValue(null);
		mockFindOneByExternalIdForUser.mockResolvedValue({ _id: 'view', view: { ...appView, external_id: 'x' } });
		const interaction = { type: 'modal.update', view: { id: 'random', external_id: 'x', blocks: [] } };

		expect(await recordInteractionView(interaction, 'app', 'user')).toBe(true);

		expect(mockFindOneByExternalIdForUser).toHaveBeenCalledWith('x', 'app', 'user');
		expect(interaction.view.id).toBe('view');
		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ _id: 'view' }));
	});

	it('skips an update whose external_id matches no view', async () => {
		mockFindOneByIdForUser.mockResolvedValue(null);
		mockFindOneByExternalIdForUser.mockResolvedValue(null);

		expect(await recordInteractionView({ type: 'modal.update', view: { id: 'r', external_id: 'x', blocks: [] } }, 'app', 'user')).toBe(
			false,
		);
		expect(mockSaveView).not.toHaveBeenCalled();
	});

	it('skips a stale update, whose hash is not the saved one', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: { ...appView, hash: 'saved' } });

		expect(await recordInteractionView({ type: 'modal.update', view: { id: 'view', hash: 'old', blocks: [] } }, 'app', 'user')).toBe(false);
		expect(mockSaveView).not.toHaveBeenCalled();
	});

	it('accepts an update that carries the saved hash', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: { ...appView, hash: 'saved' } });

		expect(await recordInteractionView({ type: 'modal.update', view: { id: 'view', hash: 'saved', blocks: [] } }, 'app', 'user')).toBe(
			true,
		);
		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ view: expect.objectContaining({ hash: 'new-hash' }) }));
	});

	it('merges an update into the recorded view, as the client does', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: appView });

		await recordInteractionView({ type: 'contextual_bar.update', view: { id: 'view', blocks: [] } }, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'contextual_bar', view: { ...appView, blocks: [], hash: 'new-hash' } }),
		);
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

	it('returns the private_metadata the app saved and ignores one the client forged', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: { ...appView, private_metadata: 'saved' } });

		const view = await withRecordedView({ id: 'view', private_metadata: 'forged', state: {} }, 'app', 'user');

		expect(view).toHaveProperty('private_metadata', 'saved');
	});

	it('drops metadata the client adds when the app saved none', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: appView });

		const view = await withRecordedView({ id: 'view', private_metadata: 'forged', submit_disabled: false, state: {} }, 'app', 'user');

		expect(view).not.toHaveProperty('private_metadata');
		expect(view).not.toHaveProperty('submit_disabled');
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
