import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { isTruthy } from '@rocket.chat/tools';

import { readableTextColor } from './colors';
import type {
	ClassificationBannerAttribute,
	ClassificationBannerPayload,
	ClassificationBannerSegment,
	ClassificationBannersConfig,
} from './types';

export const parseClassificationBannersConfig = (raw: string): ClassificationBannersConfig | null => {
	try {
		return JSON.parse(raw) as ClassificationBannersConfig;
	} catch {
		return null;
	}
};

const buildSegment = (
	attribute: ClassificationBannerAttribute,
	roomAttributes: IAbacAttributeDefinition[],
): ClassificationBannerSegment | null => {
	const roomValues = roomAttributes.find(({ key }) => key === attribute.source)?.values ?? [];
	let matched = attribute.values.filter(({ source }) => roomValues.includes(source));
	if (!matched.length) {
		return null;
	}
	if (attribute.sortAlpha) {
		matched = [...matched].sort((a, b) => a.label.localeCompare(b.label));
	}

	const body =
		attribute.groupThreshold > 0 && matched.length >= attribute.groupThreshold
			? attribute.multipleLabel
			: matched.map(({ label }) => label).join(attribute.valueSeparator);

	return {
		attrId: attribute.id,
		text: attribute.showLabel ? `${attribute.bannerLabel}${attribute.labelSeparator}${body}` : body,
	};
};

const resolveColor = (config: ClassificationBannersConfig, roomAttributes: IAbacAttributeDefinition[]): string => {
	const driver = config.attributes.find(({ drivesColor }) => drivesColor) ?? config.attributes[0];
	const roomValues = roomAttributes.find(({ key }) => key === driver.source)?.values ?? [];
	// values are ranked most restrictive first: index 0 = highest ranking
	const matched = driver.values.filter(({ source }) => roomValues.includes(source));
	if (!matched.length) {
		return config.banner.fallbackColor;
	}
	if (config.banner.colorMode === 'highest') {
		return matched[0].color;
	}
	return roomValues.map((value) => driver.values.find(({ source }) => source === value)).find(isTruthy)?.color ?? matched[0].color;
};

export const buildClassificationBanner = (
	config: ClassificationBannersConfig,
	roomAttributes: IAbacAttributeDefinition[],
): ClassificationBannerPayload => {
	const { banner } = config;
	const base = {
		style: banner.style,
		uppercase: banner.uppercase,
		monospace: banner.monospace,
	} as const;

	const segments = config.attributes
		.filter(({ showInBanner }) => showInBanner)
		.map((attribute) => buildSegment(attribute, roomAttributes))
		.filter(isTruthy);

	if (!segments.length) {
		return {
			...base,
			text: banner.fallbackText,
			segments: [],
			backgroundColor: banner.fallbackColor,
			color: readableTextColor(banner.fallbackColor),
		};
	}

	const backgroundColor = resolveColor(config, roomAttributes);
	return {
		...base,
		text: segments.map(({ text }) => text).join(banner.delimiter),
		segments,
		backgroundColor,
		color: readableTextColor(backgroundColor),
	};
};
