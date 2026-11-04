import type { IUiKitView } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { UiKitViews } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type * as UiKit from '@rocket.chat/ui-kit';

const logger = new Logger('UiKit');

const surfaceByInteractionType: Record<string, IUiKitView['type'] | undefined> = {
	'modal.open': 'modal',
	'modal.push': 'modal',
	'modal.update': 'modal',
	'contextual_bar.open': 'contextual_bar',
	'contextual_bar.update': 'contextual_bar',
};

/** One home per user and app, so publishing again replaces it. */
const homeViewId = (appId: string, userId: string): string => `home:${appId}:${userId}`;

type ViewLike = { id?: unknown; state?: unknown };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// Only the app sets these; a value the client sends back for them is never trusted.
const serverOwnedFields = ['private_metadata', 'callback_id', 'external_id', 'submit_disabled', 'hash'] as const;

/**
 * Keeps the modal or contextual bar an app opens or updates for a user, so its submit and close can carry the app's copy.
 * Stamps the view with a new `hash`, and resolves an update that names a view by `external_id`.
 * Returns `false` when the interaction is a stale or unresolvable update that must not reach the user.
 */
export const recordInteractionView = async (interaction: unknown, appId: string, userId: string | undefined): Promise<boolean> => {
	if (!userId || !isObject(interaction) || typeof interaction.type !== 'string' || !isObject(interaction.view)) {
		return true;
	}

	if (interaction.type === 'home.update') {
		try {
			await UiKitViews.saveHomeView({ _id: homeViewId(appId, userId), appId, userId, view: interaction.view as UiKit.HomeView });
		} catch (error) {
			logger.error({ msg: 'Could not record a UiKit home view', appId, err: error });
		}
		return true;
	}

	const type = surfaceByInteractionType[interaction.type];
	const view = interaction.view as UiKit.ModalView | UiKit.ContextualBarView;

	if (!type) {
		return true;
	}

	try {
		const isUpdate = interaction.type.endsWith('.update');
		let recorded = isUpdate && typeof view.id === 'string' ? await UiKitViews.findOneByIdForUser(view.id, appId, userId) : null;

		if (isUpdate && !recorded && typeof view.external_id === 'string') {
			recorded = await UiKitViews.findOneByExternalIdForUser(view.external_id, appId, userId);
			if (!recorded) {
				logger.warn({ msg: 'UiKit update names an external_id the user has no view for; skipped', externalId: view.external_id, appId });
				return false;
			}
			view.id = recorded._id;
		}

		if (typeof view.id !== 'string') {
			return true;
		}

		const recordedHash = recorded && 'hash' in recorded.view ? recorded.view.hash : undefined;
		if (recordedHash && typeof view.hash === 'string' && view.hash !== recordedHash) {
			logger.warn({ msg: 'Stale UiKit view update skipped: its hash does not match the saved view', viewId: view.id, appId });
			return false;
		}

		view.hash = Random.id();
		// An update may send only the fields that change, as the client merges it into the view it shows.
		await UiKitViews.saveView({ _id: view.id, appId, userId, type, view: recorded ? { ...recorded.view, ...view } : view });
	} catch (error) {
		logger.error({ msg: 'Could not record a UiKit view', viewId: view.id, appId, err: error });
	}

	return true;
};

/**
 * The view a user submits or closes, as the app sent it, with the state the user filled in.
 * Falls back to the client's copy when the server has none, such as a view opened before the server kept them.
 */
export const withRecordedView = async <TView extends ViewLike>(
	clientView: TView,
	appId: string,
	userId: string | undefined,
): Promise<TView> => {
	if (!userId || typeof clientView?.id !== 'string') {
		return clientView;
	}

	const recorded = await UiKitViews.findOneByIdForUser(clientView.id, appId, userId).catch((error) => {
		logger.error({ msg: 'Could not read a recorded UiKit view', viewId: clientView.id, appId, err: error });
		return null;
	});

	if (!recorded) {
		logger.debug({ msg: 'UiKit view not recorded on the server; passing the client copy to the app', viewId: clientView.id, appId });
		return clientView;
	}

	const view: TView = { ...clientView, ...recorded.view, state: clientView.state };
	for (const field of serverOwnedFields) {
		if (!(field in recorded.view)) {
			delete (view as Record<string, unknown>)[field];
		}
	}

	return view;
};
