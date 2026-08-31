import { isNodeOfType, parse } from '../src';
import type { Image, OrderedList, Timestamp } from '../src/definitions';
import { timestamp } from '../src/utils';

describe('isNodeOfType', () => {
	it('narrows timestamp nodes', () => {
		const value: unknown = timestamp('1708551317');

		expect(isNodeOfType(value, 'TIMESTAMP')).toBe(true);

		if (!isNodeOfType(value, 'TIMESTAMP')) {
			throw new Error('expected TIMESTAMP node');
		}

		const narrowed: Timestamp = value;
		expect(value.value.timestamp).toBe('1708551317');
		expect(value.value.format).toBe('t');
		expect(narrowed.value.format).toBe('t');
	});

	it('narrows ordered list nodes from parser output', () => {
		const value: unknown = parse('1. one')[0];

		expect(isNodeOfType(value, 'ORDERED_LIST')).toBe(true);

		if (!isNodeOfType(value, 'ORDERED_LIST')) {
			throw new Error('expected ORDERED_LIST node');
		}

		const narrowed: OrderedList = value;
		expect(value.value[0].number).toBe(1);
		expect(narrowed.value[0].number).toBe(1);
	});

	it('narrows image nodes from parser output', () => {
		const paragraph: unknown = parse('![logo](https://rocket.chat/logo.png)')[0];

		expect(isNodeOfType(paragraph, 'PARAGRAPH')).toBe(true);

		if (!isNodeOfType(paragraph, 'PARAGRAPH')) {
			throw new Error('expected PARAGRAPH node');
		}

		const imageNode: unknown = paragraph.value[0];

		expect(isNodeOfType(imageNode, 'IMAGE')).toBe(true);

		if (!isNodeOfType(imageNode, 'IMAGE')) {
			throw new Error('expected IMAGE node');
		}

		const narrowed: Image = imageNode;
		expect(imageNode.value.src.value).toBe('https://rocket.chat/logo.png');
		expect(narrowed.value.src.value).toBe('https://rocket.chat/logo.png');
	});

	it('returns false for mismatched types', () => {
		const value: unknown = timestamp('1708551317');

		expect(isNodeOfType(value, 'ORDERED_LIST')).toBe(false);
	});
});
