/* eslint-disable @typescript-eslint/naming-convention */

import type { IRocketChatRecord } from '../IRocketChatRecord';
import type * as UiKit from '../uikit';

type TargetPlatform = 'web' | 'mobile';
type Dictionary = {
	[lng: string]: {
		[key: string]: string;
	};
};
type Creator = 'cloud' | 'system';

export interface Announcement extends IRocketChatRecord {
	platform: TargetPlatform[];
	expireAt: Date;
	startAt: Date;
	createdBy: Creator;
	createdAt: Date;
	view: UiKit.View;
	active?: boolean;
	inactivedAt?: Date;
	snapshot?: string;

	dictionary?: Dictionary;
	surface: 'banner' | 'modal';
	selector?: {
		roles?: string[];
	};

	/* @deprecated */
	roles?: string[];
}
