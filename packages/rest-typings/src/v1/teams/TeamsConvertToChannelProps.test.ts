import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsConvertToChannelProps } from './TeamsConvertToChannelProps';

describe('TeamsConvertToChannelProps (definition/rest/v1)', () => {
	describe('isTeamsConvertToChannelProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsConvertToChannelProps, 'function');
		});
		it('should return false if neither teamName or teamId is provided', () => {
			assert.equal(isTeamsConvertToChannelProps({}), false);
		});

		it('should return true if teamName is provided', () => {
			assert.equal(isTeamsConvertToChannelProps({ teamName: 'teamName' }), true);
		});

		it('should return true if teamId is provided', () => {
			assert.equal(isTeamsConvertToChannelProps({ teamId: 'teamId' }), true);
		});

		it('should return false if both teamName and teamId are provided', () => {
			assert.equal(isTeamsConvertToChannelProps({ teamName: 'teamName', teamId: 'teamId' }), false);
		});

		it('should return false if an additionalProperties is provided', () => {
			assert.equal(
				isTeamsConvertToChannelProps({
					teamName: 'teamName',
					additionalProperties: 'additionalProperties',
				}),
				false,
			);
		});
	});
});
