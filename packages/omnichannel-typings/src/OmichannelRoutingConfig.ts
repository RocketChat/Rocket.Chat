import type { ILivechatInquiryRecord } from './IInquiry';

export type OmichannelRoutingConfig = {
	previewRoom: boolean;
	showConnecting: boolean;
	showQueue: boolean;
	showQueueLink: boolean;
	returnQueue: boolean;
	enableTriggerAction: boolean;
	autoAssignAgent: boolean;
};

export type Inquiries =
	| {
			enabled: true;
			queue: Array<ILivechatInquiryRecord>;
	  }
	| {
			enabled: false;
	  };
