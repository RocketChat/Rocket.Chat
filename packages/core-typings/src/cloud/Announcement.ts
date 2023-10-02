/* eslint-disable @typescript-eslint/naming-convention */

import type { IRocketChatRecord } from '../IRocketChatRecord';
import { type UiKitPayload } from '../UIKit';

type TargetPlatform = 'web' | 'mobile';

type Dictionary = {
	[lng: string]: {
		[key: string]: string;
	};
};

type Creator = 'cloud' | 'system';

export interface Announcement extends IRocketChatRecord {
	selector?: {
		roles?: string[];
	};
	platform: TargetPlatform[];
	expireAt: Date;
	startAt: Date;
	createdBy: Creator;
	createdAt: Date;
	dictionary?: Dictionary;
	view: UiKitPayload;
	surface: 'banner' | 'modal';
}
