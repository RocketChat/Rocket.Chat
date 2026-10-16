import type { IUiKitView } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { UiKitViews } from '@rocket.chat/models';

const logger = new Logger('UiKit');

const surfaceByInteractionType: Record<string, IUiKitView['type'] | undefined> = {
	'modal.open': 'modal',
	'modal.update': 'modal',
	'contextual_bar.open': 'contextual_bar',
	'contextual_bar.update': 'contextual_bar',
};

type ViewLike = { id?: unknown; state?: unknown };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Keeps the modal or contextual bar an app opens or updates for a user, so its submit and close can carry the app's copy. */
export const recordInteractionView = async (interaction: unknown, appId: string, userId: string | undefined): Promise<void> => {
	if (!userId || !isObject(interaction) || typeof interaction.type !== 'string' || !isObject(interaction.view)) {
		return;
	}

	const type = surfaceByInteractionType[interaction.type];
	const view = interaction.view as IUiKitView['view'];

	if (!type || typeof view.id !== 'string') {
		return;
	}

	try {
		// An update may send only the fields that change, as the client merges it into the view it shows.
		const recorded = interaction.type.endsWith('.update') ? await UiKitViews.findOneByIdForUser(view.id, appId, userId) : null;
		await UiKitViews.saveView({ _id: view.id, appId, userId, type, view: recorded ? { ...recorded.view, ...view } : view });
	} catch (error) {
		logger.error({ msg: 'Could not record a UiKit view', viewId: view.id, appId, err: error });
	}
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

	return { ...clientView, ...recorded.view, state: clientView.state };
};
