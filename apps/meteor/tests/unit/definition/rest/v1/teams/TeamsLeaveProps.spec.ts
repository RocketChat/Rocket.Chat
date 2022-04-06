import { assert } from 'chai';
import { isTeamsLeaveProps } from '@rocket.chat/rest-typings';

describe('TeamsLeaveProps (definition/rest/v1)', () => {
	describe('isTeamsLeaveProps', () => {
		it('should be a function', () => {
			assert.isFunction(isTeamsLeaveProps);
		});

		it('should return false if neither teamName or teamId is provided', () => {
			assert.isFalse(isTeamsLeaveProps({}));
		});

		it('should return true if teamId is provided', () => {
			assert.isTrue(isTeamsLeaveProps({ teamId: 'teamId' }));
		});

		it('should return true if teamName is provided', () => {
			assert.isTrue(isTeamsLeaveProps({ teamName: 'teamName' }));
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: [] }));
		});

		it('should return true if teamId are provided, but rooms are undefined', () => {
			assert.isTrue(isTeamsLeaveProps({ teamId: 'teamId', rooms: undefined }));
		});

		it('should return false if teamName and rooms are provided, but rooms is empty', () => {
			assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: [] }));
		});

		it('should return true if teamName are provided, but rooms are undefined', () => {
			assert.isTrue(isTeamsLeaveProps({ teamName: 'teamName', rooms: undefined }));
		});

		it('should return true if teamId and rooms are provided', () => {
			assert.isTrue(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['roomId'] }));
		});

		it('should return true if teamName and rooms are provided', () => {
			assert.isTrue(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['roomId'] }));
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array', () => {
			assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: {} }));
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array', () => {
			assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: {} }));
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array of strings', () => {
			assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: [1] }));
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array of strings', () => {
			assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: [1] }));
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			assert.isFalse(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['rooms'], extra: 'extra' }));
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			assert.isFalse(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['rooms'], extra: 'extra' }));
		});
	});
});
