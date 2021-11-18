/* eslint-env mocha */
import chai from 'chai';

import { isTeamsLeaveProps } from './TeamsLeaveProps';

describe('TeamsLeaveProps (definition/rest/v1)', () => {
	describe('isTeamsLeaveProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsLeaveProps);
		});

		it('should return false if neither teamName or teamId is provided', () => {
			chai.assert.isFalse(isTeamsLeaveProps({}));
		});

		it('should return true if teamId is provided', () => {
			chai.assert.isTrue(isTeamsLeaveProps({ teamId: 'teamId' }));
		});

		it('should return true if teamName is provided', () => {
			chai.assert.isTrue(isTeamsLeaveProps({ teamName: 'teamName' }));
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: [] }));
		});

		it('should return false if teamName and rooms are provided, but rooms is empty', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: [] }));
		});

		it('should return true if teamId and rooms are provided', () => {
			chai.assert.isTrue(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['roomId'] }));
		});

		it('should return true if teamName and rooms are provided', () => {
			chai.assert.isTrue(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['roomId'] }));
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: {} }));
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: {} }));
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array of strings', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: [1] }));
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array of strings', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: [1] }));
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['rooms'], extra: 'extra' }));
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			chai.assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['rooms'], extra: 'extra' }));
		});
	});
});
