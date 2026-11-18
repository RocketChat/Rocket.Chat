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

	it('skips an update to a view the user has no record of', async () => {
		mockFindOneByIdForUser.mockResolvedValue(null);

		expect(await recordInteractionView({ type: 'modal.update', view: { id: 'gone', blocks: [] } }, 'app', 'user')).toBe(false);
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

	it('removes private_metadata from the view the user gets, after saving it', async () => {
		const interaction = { type: 'modal.open', view: { ...appView, private_metadata: 'secret' } };

		await recordInteractionView(interaction, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ view: expect.objectContaining({ private_metadata: 'secret' }) }));
		expect(interaction.view).not.toHaveProperty('private_metadata');
	});

	it('keeps the recorded private_metadata when an update leaves the field out', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: { ...appView, private_metadata: 's' } });
		const interaction = { type: 'modal.update', view: { id: 'view', blocks: [] } };

		await recordInteractionView(interaction, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ view: expect.objectContaining({ private_metadata: 's' }) }));
		expect(interaction.view).not.toHaveProperty('private_metadata');
	});

	it('records an opened banner by its viewId, without the interaction fields', async () => {
		const interaction = { type: 'banner.open', triggerId: 't', appId: 'app', viewId: 'b1', blocks: [], private_metadata: 'secret' };

		await recordInteractionView(interaction, 'app', 'user');

		expect(mockSaveView).toHaveBeenCalledWith({
			_id: 'b1',
			appId: 'app',
			userId: 'user',
			type: 'banner',
			view: { appId: 'app', viewId: 'b1', blocks: [], private_metadata: 'secret', hash: 'new-hash' },
		});
		expect(interaction).not.toHaveProperty('private_metadata');
	});

	it('merges a banner update into the recorded banner', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ view: { viewId: 'b1', blocks: [], title: 'Old' } });

		await recordInteractionView({ type: 'banner.update', view: { viewId: 'b1', title: 'New' } }, 'app', 'user');

		expect(mockFindOneByIdForUser).toHaveBeenCalledWith('b1', 'app', 'user');
		expect(mockSaveView).toHaveBeenCalledWith(
			expect.objectContaining({ _id: 'b1', type: 'banner', view: { viewId: 'b1', blocks: [], title: 'New', hash: 'new-hash' } }),
		);
	});

	it('does not deliver the interaction when the view cannot be saved', async () => {
		mockSaveView.mockRejectedValue(new Error('duplicate key'));

		expect(await recordInteractionView({ type: 'modal.open', view: { ...appView } }, 'app', 'user')).toBe(false);
	});

	it.each([
		['an interaction with no view', { type: 'errors', errors: {} }, 'user'],
		['a banner close', { type: 'banner.close', viewId: 'view' }, 'user'],
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

	it('refuses a view the server has no record of', async () => {
		mockFindOneByIdForUser.mockResolvedValue(null);

		expect(await withRecordedView({ id: 'view', private_metadata: 'forged', state: {} }, 'app', 'user')).toBeNull();
	});

	it('refuses a view when the record cannot be read', async () => {
		mockFindOneByIdForUser.mockRejectedValue(new Error('down'));

		expect(await withRecordedView({ id: 'view', state: {} }, 'app', 'user')).toBeNull();
	});

	it('refuses a user view that names no id', async () => {
		expect(await withRecordedView({ state: {} }, 'app', 'user')).toBeNull();
	});

	it('passes the view through for a visitor, who has no user id', async () => {
		const clientView = { id: 'view', state: {} };

		expect(await withRecordedView(clientView, 'app', undefined)).toBe(clientView);
	});
});
