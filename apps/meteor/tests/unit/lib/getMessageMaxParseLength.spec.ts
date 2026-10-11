import { expect } from 'chai';

import { getMessageMaxParseLength } from '../../../lib/getMessageMaxParseLength';

describe('getMessageMaxParseLength', () => {
	afterEach(() => {
		delete process.env.MESSAGE_MAX_PARSE_LENGTH;
	});

	it('should return 0 (default) when env var is not set', () => {
		delete process.env.MESSAGE_MAX_PARSE_LENGTH;
		expect(getMessageMaxParseLength()).to.equal(0);
	});

	it('should return 0 (default) when env var is empty string', () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '';
		expect(getMessageMaxParseLength()).to.equal(0);
	});

	it('should return 0 (default) when env var is not a number', () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = 'abc';
		expect(getMessageMaxParseLength()).to.equal(0);
	});

	it('should return the parsed number when env var is a valid integer', () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '5000';
		expect(getMessageMaxParseLength()).to.equal(5000);
	});

	it('should return 0 when env var is "0"', () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '0';
		expect(getMessageMaxParseLength()).to.equal(0);
	});

	it('should return 0 (default) when env var is Infinity', () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = 'Infinity';
		expect(getMessageMaxParseLength()).to.equal(0);
	});
});
