import type { IUiKitView } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { UiKitViews } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

const logger = new Logger('UiKit');

const surfaceByInteractionType: Record<string, IUiKitView['type'] | undefined> = {
	'modal.open': 'modal',
	'modal.push': 'modal',
	'modal.update': 'modal',
	'contextual_bar.open': 'contextual_bar',
	'contextual_bar.update': 'contextual_bar',
	'banner.open': 'banner',
	'banner.update': 'banner',
};

type ViewLike = { id?: unknown; state?: unknown };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// Only the app sets these; a value the client sends back for them is never trusted.
const serverOwnedFields = ['private_metadata', 'callback_id', 'external_id', 'submit_disabled', 'hash'] as const;

/**
 * Keeps the modal, contextual bar or banner an app opens or updates for a user, so its submit and close can carry the app's copy.
 * Stamps the view with a new `hash`, and resolves an update that names a view by `external_id`.
 * Returns `false` when the interaction is a stale or unresolvable update that must not reach the user.
 */
export const recordInteractionView = async (interaction: unknown, appId: string, userId: string | undefined): Promise<boolean> => {
	if (!userId || !isObject(interaction) || typeof interaction.type !== 'string') {
		return true;
	}

	const type = surfaceByInteractionType[interaction.type];
	// An opened banner carries its fields on the interaction itself; every other surface nests them in `view`.
	const source = interaction.type === 'banner.open' ? interaction : interaction.view;

	if (!type || !isObject(source)) {
		return true;
	}

	const view = source;
	const idKey = type === 'banner' ? 'viewId' : 'id';

	try {
		const isUpdate = interaction.type.endsWith('.update');
		const viewId = view[idKey];
		let recorded = isUpdate && typeof viewId === 'string' ? await UiKitViews.findOneByIdForUser(viewId, appId, userId) : null;

		if (isUpdate && !recorded && typeof view.external_id === 'string') {
			recorded = await UiKitViews.findOneByExternalIdForUser(view.external_id, appId, userId);
			if (!recorded) {
				logger.warn({ msg: 'UiKit update names an external_id the user has no view for; skipped', externalId: view.external_id, appId });
				return false;
			}
			view[idKey] = recorded.viewId;
		}

		if (typeof view[idKey] !== 'string') {
			return true;
		}

		if (isUpdate && !recorded) {
			logger.warn({ msg: 'UiKit update names a view the user has no record of; skipped', viewId: view[idKey], appId });
			return false;
		}

		const recordedHash = recorded && 'hash' in recorded.view ? recorded.view.hash : undefined;
		if (recordedHash && typeof view.hash === 'string' && view.hash !== recordedHash) {
			logger.warn({ msg: 'Stale UiKit view update skipped: its hash does not match the saved view', viewId: view[idKey], appId });
			return false;
		}

		view.hash = Random.id();
		// The interaction fields of an opened banner are not part of its view.
		const { type: _type, triggerId: _triggerId, ...fields } = view;
		const saved = (interaction.type === 'banner.open' ? fields : view) as IUiKitView['view'];
		// An update may send only the fields that change, as the client merges it into the view it shows.
		await UiKitViews.saveView({ viewId: view[idKey], appId, userId, type, view: { ...recorded?.view, ...saved } });
		// The app's private data stays on the server; it comes back from the record on submit and close.
		delete view.private_metadata;
	} catch (error) {
		logger.error({ msg: 'Could not record a UiKit view', viewId: view[idKey], appId, err: error });
		return false;
	}

	return true;
};

/**
 * The view a user submits or closes, as the app sent it, with the state the user filled in.
 * Returns `null` when a user's view has no record or the record cannot be read, so the caller must not call the app.
 */
export const withRecordedView = async <TView extends ViewLike>(
	clientView: TView,
	appId: string,
	userId: string | undefined,
): Promise<TView | null> => {
	if (!userId) {
		return clientView;
	}

	if (typeof clientView?.id !== 'string') {
		return null;
	}

	const recorded = await UiKitViews.findOneByIdForUser(clientView.id, appId, userId).catch((error) => {
		logger.error({ msg: 'Could not read a recorded UiKit view', viewId: clientView.id, appId, err: error });
		return null;
	});

	if (!recorded) {
		logger.warn({ msg: 'UiKit view not recorded on the server; refusing it', viewId: clientView.id, appId });
		return null;
	}

	const view: TView = { ...clientView, ...recorded.view, state: clientView.state };
	for (const field of serverOwnedFields) {
		if (!(field in recorded.view)) {
			delete (view as Record<string, unknown>)[field];
		}
	}

	return view;
};
