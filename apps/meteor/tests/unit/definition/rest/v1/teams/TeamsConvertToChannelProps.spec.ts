import { assert } from 'chai';
import { isTeamsConvertToChannelProps } from '@rocket.chat/rest-typings';

describe('TeamsConvertToChannelProps (definition/rest/v1)', () => {
	describe('isTeamsConvertToChannelProps', () => {
		it('should be a function', () => {
			assert.isFunction(isTeamsConvertToChannelProps);
		});
		it('should return false if neither teamName or teamId is provided', () => {
			assert.isFalse(isTeamsConvertToChannelProps({}));
		});

		it('should return true if teamName is provided', () => {
			assert.isTrue(isTeamsConvertToChannelProps({ teamName: 'teamName' }));
		});

		it('should return true if teamId is provided', () => {
			assert.isTrue(isTeamsConvertToChannelProps({ teamId: 'teamId' }));
		});

		it('should return false if both teamName and teamId are provided', () => {
			assert.isFalse(isTeamsConvertToChannelProps({ teamName: 'teamName', teamId: 'teamId' }));
		});

		it('should return false if teamName is not a string', () => {
			assert.isFalse(isTeamsConvertToChannelProps({ teamName: 1 }));
		});

		it('should return false if teamId is not a string', () => {
			assert.isFalse(isTeamsConvertToChannelProps({ teamId: 1 }));
		});

		it('should return false if an additionalProperties is provided', () => {
			assert.isFalse(
				isTeamsConvertToChannelProps({
					teamName: 'teamName',
					additionalProperties: 'additionalProperties',
				}),
			);
		});
	});
});
