// TODO: The browser-side UI host code (AppClientManager, AppsEngineUIHost,
// AppsEngineUIClient) does not semantically belong in @rocket.chat/apps —
// this package is server-side orchestration. It was moved here as part of
// the apps-engine split for pragmatic consolidation. A future split into a
// dedicated @rocket.chat/apps-client package is tracked in:
// https://github.com/RocketChat/Rocket.Chat/issues/PLACEHOLDER
import { AppClientManager } from './AppClientManager';
import { AppServerCommunicator } from './AppServerCommunicator';

export { AppClientManager, AppServerCommunicator };
