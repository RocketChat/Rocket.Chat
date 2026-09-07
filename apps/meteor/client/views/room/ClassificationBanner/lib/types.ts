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

export type ClassificationBannerStyle = 'classic';

/**
 * Banner for rooms carrying no ABAC attributes — DMs, Group DMs, discussions, federated rooms
 * (ABAC-P4 M4, schema v2). The `attributes[]` model derives text and colour from a room's
 * attributes, so it cannot describe these rooms; this behaves like `fallbackText`/`fallbackColor`.
 */
export type ClassificationNonAbacBanner = {
	enabled: boolean;
	text: string;
	color: string;
};

export type ClassificationBannersConfig = {
	/** v1 documents are migrated to 2 by `v336`; the union keeps an un-migrated read from crashing. */
	version: 1 | 2;
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
	/** Absent means rooms without attributes show no banner — the pre-v2 behaviour. */
	nonAbacBanner?: ClassificationNonAbacBanner;
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
	uppercase: boolean;
	monospace: boolean;
};
