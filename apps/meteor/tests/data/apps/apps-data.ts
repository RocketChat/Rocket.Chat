import type { Path } from '@rocket.chat/rest-typings';

export const APP_URL = 'https://medsensehealth.ca';
export const APP_NAME = 'Apps.RocketChat.Tester';

type PathWithoutPrefix<TPath> = TPath extends `/apps${infer U}` ? U : never;

export function apps(path?: ''): `/api/apps`;
export function apps<TPath extends PathWithoutPrefix<Path>>(path: TPath): `/api/apps${TPath}`;
export function apps(path = '') {
	return `/api/apps${path}` as const;
}
