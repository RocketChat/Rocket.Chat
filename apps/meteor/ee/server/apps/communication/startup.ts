import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from '.';

export default (function communicatorsStartup() {
	const notifier = new AppServerNotifier();
	const restapi = new AppsRestApi();
	const uikit = new AppUIKitInteractionApi();

	return {
		notifier,
		restapi,
		uikit,
	};
})();
