import type { ClassificationBannerStyle } from '@rocket.chat/core-typings';

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
	showLabel: boolean;
	bannerLabel: string;
	labelSeparator: string;
	valueSeparator: string;
	sortAlpha: boolean;
	groupThreshold: number;
	multipleLabel: string;
	drivesColor: boolean;
	values: ClassificationBannerValue[];
};

export type ClassificationRoomType = 'direct' | 'public' | 'private';

export type ClassificationRoomMatch = {
	type?: ClassificationRoomType[];
	federated?: boolean;
	discussion?: boolean;
	team?: boolean;
};

export type ClassificationNonAbacBanner = {
	enabled: boolean;
	text: string;
	color: string;
	match?: ClassificationRoomMatch;
};

export type ClassificationBannersConfig = {
	version: 1;
	enabled: boolean;
	banner: {
		style: ClassificationBannerStyle;
		uppercase: boolean;
		monospace: boolean;
		delimiter: string;
		colorMode: 'highest' | 'attribute';
		fallbackText: string;
		fallbackColor: string;
	};
	nonAbacBanner?: ClassificationNonAbacBanner[];
	attributes: ClassificationBannerAttribute[];
};
