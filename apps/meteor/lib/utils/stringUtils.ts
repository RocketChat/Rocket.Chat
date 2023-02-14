import { escapeRegExp } from '@rocket.chat/string-helpers';
import { sanitize } from 'dompurify';

export function truncate(str: string, length: number): string {
	return str.length > length ? `${str.slice(0, length - 3)}...` : str;
}

function makeString(object: unknown): string {
	if (!object) return '';
	return String(object);
}

function defaultToWhiteSpace(characters: unknown): string {
	if (!characters) return '\\s';
	if (typeof characters === 'object' && 'source' in characters) return (characters as { source: string }).source;
	return `[${escapeRegExp(makeString(characters))}]`;
}

const nativeTrim = String.prototype.trim;
const nativeTrimLeft = String.prototype.trimLeft;
const nativeTrimRight = String.prototype.trimRight;

export function trim(_str: unknown, _characters?: unknown): string {
	const str = makeString(_str);
	if (!_characters && nativeTrim) return nativeTrim.call(str);
	const characters = defaultToWhiteSpace(_characters);
	return str.replace(new RegExp(`^${characters}+|${characters}+$`, 'g'), '');
}

export function ltrim(_str: unknown, _characters: unknown): string {
	const str = makeString(_str);
	if (!_characters && nativeTrimLeft) return nativeTrimLeft.call(str);
	const characters = defaultToWhiteSpace(_characters);
	return str.replace(new RegExp(`^${characters}+`), '');
}

export function rtrim(_str: unknown, _characters: unknown): string {
	const str = makeString(_str);
	if (!_characters && nativeTrimRight) return nativeTrimRight.call(str);
	const characters = defaultToWhiteSpace(_characters);
	return str.replace(new RegExp(`${characters}+$`), '');
}

export function capitalize(_str: unknown, lowercaseRest: boolean): string {
	const str = makeString(_str);
	const remainingChars = !lowercaseRest ? str.slice(1) : str.slice(1).toLowerCase();

	return str.charAt(0).toUpperCase() + remainingChars;
}

export function stripTags(str: unknown): string {
	return sanitize(makeString(str)).replace(/<\/?[^>]+>/g, '');
}

export function strLeft(_str: unknown, _sep: unknown): string {
	const str = makeString(_str);
	const sep = makeString(_sep);
	const pos = !sep ? -1 : str.indexOf(sep);
	return ~pos ? str.slice(0, pos) : str;
}

export function strRight(_str: unknown, _sep: unknown): string {
	const str = makeString(_str);
	const sep = makeString(_sep);
	const pos = !sep ? -1 : str.indexOf(sep);
	return ~pos ? str.slice(pos + sep.length, str.length) : str;
}

export function strRightBack(_str: unknown, _sep: unknown): string {
	const str = makeString(_str);
	const sep = makeString(_sep);
	const pos = !sep ? -1 : str.lastIndexOf(sep);
	return ~pos ? str.slice(pos + sep.length, str.length) : str;
}

export function numberFormat(_number: number, dec: number, dsep?: string, tsep?: string): string {
	if (isNaN(_number) || _number === null || _number === undefined) return '';

	const number = _number.toFixed(~~dec);
	tsep = typeof tsep === 'string' ? tsep : ',';

	const parts = number.split('.');
	const fnums = parts[0];
	const decimals = parts[1] ? (dsep || '.') + parts[1] : '';

	return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, `$1${tsep}`) + decimals;
}

export function pad(_str: unknown, _length: number, padStr?: string, type: 'right' | 'left' | 'both' = 'right') {
	const str = makeString(_str);
	const length = ~~_length;

	let padlen = 0;

	if (!padStr) padStr = ' ';
	else if (padStr.length > 1) padStr = padStr.charAt(0);

	switch (type) {
		case 'right':
			padlen = length - str.length;
			return str + padStr.repeat(padlen);
		case 'both':
			padlen = length - str.length;
			return padStr.repeat(Math.ceil(padlen / 2)) + str + padStr.repeat(Math.floor(padlen / 2));
		default: // 'left'
			padlen = length - str.length;
			return padStr.repeat(padlen) + str;
	}
}

export function lrpad(str: unknown, length: number, padStr?: string): string {
	return pad(str, length, padStr, 'both');
}
