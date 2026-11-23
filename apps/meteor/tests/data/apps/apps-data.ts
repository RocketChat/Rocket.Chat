import type { Path } from '@rocket.chat/rest-typings';

// The Rocket.Chat server downloads this, so it names the mock-server by its address inside the CI network.
export const APP_URL = 'http://mock-server.dev:8080/__fixtures/appsrocketchattester_0.3.0.zip';
export const APP_NAME = 'Apps.RocketChat.Tester';

type PathWithoutPrefix<TPath> = TPath extends `/apps${infer U}` ? U : never;

export function apps(path?: ''): `/api/apps`;
export function apps<TPath extends PathWithoutPrefix<Path>>(path: TPath): `/api/apps${TPath}`;
export function apps(path = '') {
	return `/api/apps${path}` as const;
}

export function installedApps() {
	return `/api/apps/installed` as const;
}
