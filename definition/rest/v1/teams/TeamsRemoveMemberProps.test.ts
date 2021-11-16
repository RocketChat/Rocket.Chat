/* eslint-env mocha */
import chai from 'chai';

import { isTeamsRemoveMemberProps } from './TeamsRemoveMemberProps';

describe('Teams (definition/rest/v1)', () => {
	describe('isTeamsRemoveMemberProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsRemoveMemberProps);
		});
		it('should return false if parameter is empty', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({}));
		});
		it('should return false if teamId is is informed but missing userId', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId' }));
		});
		it('should return false if teamName is is informed but missing userId', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName' }));
		});

		it('should return true if teamId and userId are informed', () => {
			chai.assert.isTrue(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId' }));
		});
		it('should return true if teamName and userId are informed', () => {
			chai.assert.isTrue(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId' }));
		});


		it('should return false if teamName and userId are informed but rooms are empty', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: [] }));
		});

		it('should return false if teamId and userId are informed and rooms are empty', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }));
		});

		it('should return false if teamId and userId are informed but rooms are empty', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }));
		});

		it('should return true if teamId and userId are informed and rooms are informed', () => {
			chai.assert.isTrue(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: ['room'] }));
		});

		it('should return false if teamId and userId are informed and rooms are informed but rooms is not an array of strings', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [123] }));
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: ['room'], extra: 'extra' }));
		});

		it('should return false if teamId and userId are informed and rooms are informed but there is an extra property', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: ['room'], extra: 'extra' }));
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			chai.assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: ['room'], extra: 'extra' }));
		});
	});
});
