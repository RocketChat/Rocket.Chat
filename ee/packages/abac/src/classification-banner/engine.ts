import type { ClassificationBannerPayload, ClassificationBannerSegment, IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { isABACManagedRoom, isDiscussion, isOmnichannelRoom, isRoomFederated } from '@rocket.chat/core-typings';
import { isTruthy } from '@rocket.chat/tools';

import { readableTextColor } from './colors';
import type { ClassificationBannerAttribute, ClassificationBannersConfig, ClassificationRoomMatch, ClassificationRoomType } from './types';

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

const buildPlainBanner = (
	{ style, uppercase, monospace }: ClassificationBannersConfig['banner'],
	text: string,
	backgroundColor: string,
): ClassificationBannerPayload => ({
	style,
	uppercase,
	monospace,
	text,
	segments: [],
	backgroundColor,
	color: readableTextColor(backgroundColor),
});

export const buildClassificationBanner = (
	config: ClassificationBannersConfig,
	roomAttributes: IAbacAttributeDefinition[],
): ClassificationBannerPayload => {
	const { banner } = config;
	const segments = config.attributes
		.filter(({ showInBanner }) => showInBanner)
		.map((attribute) => buildSegment(attribute, roomAttributes))
		.filter(isTruthy);

	if (!segments.length) {
		return buildPlainBanner(banner, banner.fallbackText, banner.fallbackColor);
	}

	return {
		...buildPlainBanner(banner, segments.map(({ text }) => text).join(banner.delimiter), resolveColor(config, roomAttributes)),
		segments,
	};
};

type ClassifiedRoom = Pick<IRoom, 't' | 'abacAttributes' | 'federated' | 'prid' | 'teamId'>;

const roomTypes: Record<ClassificationRoomType, IRoom['t']> = {
	direct: 'd',
	public: 'c',
	private: 'p',
};

const matchesRoom = (room: ClassifiedRoom, { type, federated, discussion, team }: ClassificationRoomMatch): boolean =>
	(!type || type.some((name) => roomTypes[name] === room.t)) &&
	(federated === undefined || federated === isRoomFederated(room)) &&
	(discussion === undefined || discussion === isDiscussion(room)) &&
	(team === undefined || team === !!room.teamId);

export const buildRoomClassificationBanner = (
	config: ClassificationBannersConfig,
	room: ClassifiedRoom,
): ClassificationBannerPayload | undefined => {
	if (isOmnichannelRoom(room)) {
		return undefined;
	}

	if (isABACManagedRoom(room)) {
		return buildClassificationBanner(config, room.abacAttributes);
	}

	const { banner, nonAbacBanner } = config;
	const entry =
		nonAbacBanner?.find(({ enabled, match }) => enabled && match && matchesRoom(room, match)) ??
		nonAbacBanner?.find(({ enabled, match }) => enabled && !match);
	return entry && buildPlainBanner(banner, entry.text, entry.color);
};
