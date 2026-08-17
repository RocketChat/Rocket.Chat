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
	const mapped = attribute.values.filter(({ source }) => roomValues.includes(source));
	const unmapped = roomValues.filter((value) => !attribute.values.some(({ source }) => source === value)).map((label) => ({ label }));
	if (attribute.sortAlpha) {
		const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);
		mapped.sort(byLabel);
		unmapped.sort(byLabel);
	}
	const matched = [...mapped, ...unmapped];
	if (!matched.length) {
		return null;
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

const resolveColor = ({ attributes, banner }: ClassificationBannersConfig, roomAttributes: IAbacAttributeDefinition[]): string => {
	const driver = attributes.find(({ drivesColor }) => drivesColor) ?? attributes[0];
	const roomValues = roomAttributes.find(({ key }) => key === driver.source)?.values ?? [];
	// values are ranked most restrictive first, so in 'highest' mode the first match wins;
	// in 'attribute' mode the room's own value order decides instead
	const match =
		banner.colorMode === 'highest'
			? driver.values.find(({ source }) => roomValues.includes(source))
			: roomValues.map((value) => driver.values.find(({ source }) => source === value)).find(isTruthy);
	return match?.color ?? banner.fallbackColor;
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
