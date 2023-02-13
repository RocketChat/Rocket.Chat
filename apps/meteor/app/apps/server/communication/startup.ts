import { AppMethods, AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from '.';

export default (function communicatorsStartup() {
	const methods = new AppMethods();
	const notifier = new AppServerNotifier();
	const restapi = new AppsRestApi();
	const uikit = new AppUIKitInteractionApi();

	return {
		methods,
		notifier,
		restapi,
		uikit,
	};
})();
