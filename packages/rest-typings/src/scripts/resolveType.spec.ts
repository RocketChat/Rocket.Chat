import * as ts from 'typescript';

import { resolveType } from './resolveType';

describe('resolveType', () => {
	it('should resolve to literal', () => {
		const stringLiteralTypeNode = ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('hello'));

		const resolved = resolveType(stringLiteralTypeNode);

		expect(resolved).toBe('hello');
	});
});
