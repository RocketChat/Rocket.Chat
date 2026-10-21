import type { MitelCallItem } from '../definition';
import { parseMitelDuration } from './parseMitelDuration';
import { parseMitelTimestamp } from './parseMitelTimestamp';

const stringAttributes: string[] = [
	'directoryNumber',
	'name',
	'callIdentity',
	'timeZone',
	'typeOfCall',
	'firstDialledNumber',
	'remoteNumber',
	'directoryNumber2',
	'name2',
	'infoText2',
] as const;

function isValidBaseAttribute(key: string, value: unknown): key is keyof MitelCallItem {
	if (!stringAttributes.includes(key) || typeof value !== 'string') {
		return false;
	}

	if (key === 'typeOfCall') {
		return isValidTypeOfCall(value);
	}

	return true;
}

function isValidTypeOfCall(value: string): value is Required<MitelCallItem>['typeOfCall'] {
	return ['incoming-answered', 'incoming-missed', 'outgoing'].includes(value);
}

export function parseMitelCallItem(record: Record<string, unknown>): MitelCallItem {
	const baseValues: Partial<MitelCallItem> = Object.fromEntries(
		Object.entries(record).filter(([key, value]) => isValidBaseAttribute(key, value)),
	);

	return {
		...baseValues,

		transferredCall: Boolean(record.transferredCall) && record.transferredCall !== 'false',
		divertedCall: Boolean(record.divertedCall) && record.divertedCall !== 'false',
		dateTime: parseMitelTimestamp(record.dateTime),
		duration: parseMitelDuration(record.duration),

		...(record.typeOfCall === 'outgoing' &&
			record.duration === '' && {
				typeOfCall: 'outgoing-missed',
			}),
	};
}
