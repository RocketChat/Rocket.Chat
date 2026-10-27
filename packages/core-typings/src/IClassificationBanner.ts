export type ClassificationBannerStyle = 'classic';

export type ClassificationBannerSegment = {
	attrId: string;
	text: string;
};

export type ClassificationBannerPayload = {
	text: string;
	segments: ClassificationBannerSegment[];
	backgroundColor: string;
	color: string;
	style: ClassificationBannerStyle;
	uppercase: boolean;
	monospace: boolean;
};
