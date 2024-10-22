/* eslint-disable @typescript-eslint/naming-convention */
import type { CalloutBlock, ContextBlock, DividerBlock, ImageBlock, SectionBlock } from '@rocket.chat/ui-kit';

type CloudSyncAnnouncementLayoutBlock = ContextBlock | DividerBlock | ImageBlock | SectionBlock | CalloutBlock;
type CloudSyncAnnouncementLayout = CloudSyncAnnouncementLayoutBlock[];

export interface CloudSyncAnnouncement {
	viewId: string;
	appId: string;
	blocks: CloudSyncAnnouncementLayout;
}
