import { Logger } from '@rocket.chat/logger';
import { UiKitViews } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type * as UiKit from '@rocket.chat/ui-kit';

const logger = new Logger('UiKit');

/**
 * Returns the home an app last published for a user and tells the app the user opened it,
 * so the app can publish a fresher one; that one reaches the user as a `home.update`.
 */
export const openAppHome = async (
	appId: string,
	userId: string,
	notifyApp: (triggerId: string, view: UiKit.HomeView | undefined) => Promise<unknown>,
): Promise<UiKit.HomeView | undefined> => {
	const stored = await UiKitViews.findHomeViewByAppIdAndUserId(appId, userId);
	const view = stored?.view as UiKit.HomeView | undefined;

	notifyApp(Random.id(), view).catch((error) => {
		logger.error({ msg: 'The app failed to handle appHomeOpened', appId, err: error });
	});

	return view;
};
