import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { isTruthy } from '@rocket.chat/tools';

import { FALLBACK_COLOR, FALLBACK_TEXT } from './constants';
import type {
	ClassificationBannerAttribute,
	ClassificationBannerPayload,
	ClassificationBannerSegment,
	ClassificationBannersConfig,
} from './types';

export const readableTextColor = (hex: string): '#1F2329' | '#FFFFFF' => {
	const [r, g, b] = [0, 2, 4].map((offset) => parseInt(hex.replace('#', '').slice(offset, offset + 2), 16) / 255);
	const linearize = (channel: number): number => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
	const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
	return luminance > 0.55 ? '#1F2329' : '#FFFFFF';
};

const isStructurallyValidConfig = (config: ClassificationBannersConfig): boolean =>
	config.version === 1 &&
	typeof config.enabled === 'boolean' &&
	typeof config.banner?.delimiter === 'string' &&
	Array.isArray(config.attributes) &&
	config.attributes.length > 0 &&
	config.attributes.every(
		(attribute) => typeof attribute?.id === 'string' && typeof attribute.source === 'string' && Array.isArray(attribute.values),
	);

export const parseClassificationBannersConfig = (raw: string): ClassificationBannersConfig | null => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (typeof parsed !== 'object' || parsed === null) {
		return null;
	}

	const config = parsed as ClassificationBannersConfig;
	return isStructurallyValidConfig(config) ? config : null;
};

const buildSegment = (
	attribute: ClassificationBannerAttribute,
	roomAttributes: IAbacAttributeDefinition[],
): ClassificationBannerSegment | null => {
	const roomValues = roomAttributes.find(({ key }) => key === attribute.source)?.values ?? [];
	let matched = attribute.values.filter(({ source }) => roomValues.includes(source));
	if (matched.length === 0) {
		return null;
	}
	if (attribute.sortAlpha) {
		matched = [...matched].sort((a, b) => a.label.localeCompare(b.label));
	}

	const threshold = attribute.groupThreshold ?? 0;
	const body =
		threshold > 0 && matched.length >= threshold
			? (attribute.multipleLabel ?? '')
			: matched.map(({ label }) => label).join(attribute.valueSeparator ?? '/');

	return {
		attrId: attribute.id,
		text: attribute.showLabel ? `${attribute.bannerLabel ?? ''}${attribute.labelSeparator ?? ''}${body}` : body,
	};
};

const resolveColor = (config: ClassificationBannersConfig, roomAttributes: IAbacAttributeDefinition[]): string => {
	const driver = config.attributes.find(({ drivesColor }) => drivesColor) ?? config.attributes[0];
	const roomValues = roomAttributes.find(({ key }) => key === driver.source)?.values ?? [];
	// values are ranked most restrictive first: index 0 = highest ranking
	const matched = driver.values.filter(({ source }) => roomValues.includes(source));
	if (matched.length === 0) {
		return config.banner.fallbackColor ?? FALLBACK_COLOR;
	}
	if ((config.banner.colorMode ?? 'highest') === 'highest') {
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
		style: banner.style ?? 'classic',
		uppercase: banner.uppercase ?? true,
		monospace: banner.monospace ?? false,
	} as const;

	const segments = config.attributes
		.filter(({ showInBanner }) => showInBanner)
		.map((attribute) => buildSegment(attribute, roomAttributes))
		.filter(isTruthy);

	if (segments.length === 0) {
		const backgroundColor = banner.fallbackColor ?? FALLBACK_COLOR;
		return {
			...base,
			text: banner.fallbackText ?? FALLBACK_TEXT,
			segments: [],
			backgroundColor,
			color: readableTextColor(backgroundColor),
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
