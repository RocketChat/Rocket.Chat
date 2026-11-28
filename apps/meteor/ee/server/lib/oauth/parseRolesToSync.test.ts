import { describe, it } from 'node:test';

import { expect } from 'chai';

import { parseRolesToSync } from './parseRolesToSync';

describe('parseRolesToSync', () => {
	it('returns an empty list when the setting is undefined', () => {
		expect(parseRolesToSync(undefined)).to.eql([]);
	});

	it('returns an empty list when the setting is empty', () => {
		expect(parseRolesToSync('')).to.eql([]);
		expect(parseRolesToSync(' , ')).to.eql([]);
	});

	it('trims and parses configured roles', () => {
		expect(parseRolesToSync(' admin, user ')).to.eql(['admin', 'user']);
	});
});
