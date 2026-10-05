import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

export interface ISettings {
	[key: string]: ISetting;
}
