import { UiKitViews } from '@rocket.chat/models';

/**
 * Names the modal a block action or submit came from as the one to close when the app answers `modal.close` without a target.
 * Only a Livechat visitor's view, which has no record and is always a modal, or a recorded modal gets the default.
 */
export const withDefaultCloseTarget = async (
	result: unknown,
	container: { type: string; id: string },
	appId: string,
	userId: string | undefined,
): Promise<void> => {
	const response = result as { type?: string; viewId?: string; view?: unknown } | null | undefined;
	if (response?.type !== 'modal.close' || response.viewId || response.view || container?.type !== 'view') {
		return;
	}

	if (userId) {
		const recorded = await UiKitViews.findOneByIdForUser(container.id, appId, userId).catch(() => null);
		if (recorded?.type !== 'modal') {
			return;
		}
	}

	response.viewId = container.id;
};

/** A submit whose view update was dropped answers with an error, so the client keeps the view open. */
export const viewSubmitAnswer = <T>(delivered: boolean, result: T) =>
	delivered ? { status: 200, body: result } : { status: 409, body: { error: 'The view update was not delivered' } };
