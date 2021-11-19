/* eslint-env mocha */
import chai from 'chai';

import { isTeamsConvertToChannelProps } from './TeamsConvertToChannelProps';

describe('TeamsConvertToChannelProps (definition/rest/v1)', () => {
	describe('isTeamsConvertToChannelProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsConvertToChannelProps);
		});
		it('should return false if neither teamName or teamId is provided', () => {
			chai.assert.isFalse(isTeamsConvertToChannelProps({}));
		});

		it('should return true if teamName is provided', () => {
			chai.assert.isTrue(isTeamsConvertToChannelProps({ teamName: 'teamName' }));
		});

		it('should return true if teamId is provided', () => {
			chai.assert.isTrue(isTeamsConvertToChannelProps({ teamId: 'teamId' }));
		});

		it('should return false if both teamName and teamId are provided', () => {
			chai.assert.isFalse(isTeamsConvertToChannelProps({ teamName: 'teamName', teamId: 'teamId' }));
		});

		it('should return false if teamName is not a string', () => {
			chai.assert.isFalse(isTeamsConvertToChannelProps({ teamName: 1 }));
		});

		it('should return false if teamId is not a string', () => {
			chai.assert.isFalse(isTeamsConvertToChannelProps({ teamId: 1 }));
		});

		it('should return false if an additionalProperties is provided', () => {
			chai.assert.isFalse(isTeamsConvertToChannelProps({ teamName: 'teamName', additionalProperties: 'additionalProperties' }));
		});
	});
});
