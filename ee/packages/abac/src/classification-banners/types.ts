export type ClassificationBannerValue = {
	source: string;
	label: string;
	color: string;
};

export type ClassificationBannerAttribute = {
	id: string;
	source: string;
	label: string;
	showInBanner: boolean;
	showLabel?: boolean;
	bannerLabel?: string;
	labelSeparator?: string;
	valueSeparator?: string;
	sortAlpha?: boolean;
	groupThreshold?: number;
	multipleLabel?: string;
	drivesColor?: boolean;
	values: ClassificationBannerValue[];
};

export type ClassificationBannerStyle = 'classic' | 'segmented' | 'edge';

export type ClassificationBannerPosition = 'top' | 'bottom' | 'both';

export type ClassificationBannersConfig = {
	version: 1;
	enabled: boolean;
	source?: 'idp' | 'manual';
	banner: {
		style?: ClassificationBannerStyle;
		position?: ClassificationBannerPosition;
		uppercase?: boolean;
		monospace?: boolean;
		delimiter: string;
		colorMode?: 'highest' | 'attribute';
		fallbackText?: string;
		fallbackColor?: string;
	};
	attributes: ClassificationBannerAttribute[];
};

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
	position: ClassificationBannerPosition;
	uppercase: boolean;
	monospace: boolean;
	fallback: boolean;
};
