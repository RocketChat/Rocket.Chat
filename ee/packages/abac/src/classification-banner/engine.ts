import type { ClassificationBannerPayload, ClassificationBannerSegment, IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import { isABACManagedRoom, isRoomFederated } from '@rocket.chat/core-typings';
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

	const backgroundColor = resolveColor(config, roomAttributes);
	return {
		style: banner.style,
		uppercase: banner.uppercase,
		monospace: banner.monospace,
		text: segments.map(({ text }) => text).join(banner.delimiter),
		segments,
		backgroundColor,
		color: readableTextColor(backgroundColor),
	};
};

type ClassifiedRoom = Pick<IRoom, 't' | 'abacAttributes' | 'uids' | 'federated' | 'prid' | 'teamMain' | 'teamId'>;

const roomTypes: Record<IRoom['t'], ClassificationRoomType> = {
	d: 'direct',
	c: 'public',
	p: 'private',
	l: 'omnichannel',
};

const getRoomType = ({ t, uids }: ClassifiedRoom): ClassificationRoomType =>
	t === 'd' && (uids?.length ?? 0) > 2 ? 'groupDirect' : roomTypes[t];

const matchesRoom = (room: ClassifiedRoom, { type, federated, discussion, team }: ClassificationRoomMatch = {}): boolean =>
	(!type?.length || type.includes(getRoomType(room))) &&
	(federated === undefined || federated === isRoomFederated(room)) &&
	(discussion === undefined || discussion === Boolean(room.prid)) &&
	(team === undefined || team === (room.teamMain === true || Boolean(room.teamId)));

export const buildRoomClassificationBanner = (
	config: ClassificationBannersConfig,
	room: ClassifiedRoom,
): ClassificationBannerPayload | undefined => {
	if (isABACManagedRoom(room)) {
		return buildClassificationBanner(config, room.abacAttributes);
	}

	const { banner, nonAbacBanner } = config;
	const entry = [nonAbacBanner ?? []].flat().find(({ enabled, match }) => enabled && matchesRoom(room, match));
	return entry && buildPlainBanner(banner, entry.text, entry.color);
};
