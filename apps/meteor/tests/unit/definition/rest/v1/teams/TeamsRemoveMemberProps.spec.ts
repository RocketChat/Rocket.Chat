import { assert } from 'chai';
import { isTeamsRemoveMemberProps } from '@rocket.chat/rest-typings';

describe('Teams (definition/rest/v1)', () => {
	describe('isTeamsRemoveMemberProps', () => {
		it('should be a function', () => {
			assert.isFunction(isTeamsRemoveMemberProps);
		});
		it('should return false if parameter is empty', () => {
			assert.isFalse(isTeamsRemoveMemberProps({}));
		});
		it('should return false if teamId is is informed but missing userId', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId' }));
		});
		it('should return false if teamName is is informed but missing userId', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName' }));
		});

		it('should return true if teamId and userId are informed', () => {
			assert.isTrue(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId' }));
		});
		it('should return true if teamName and userId are informed', () => {
			assert.isTrue(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId' }));
		});

		it('should return false if teamName and userId are informed but rooms are empty', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: [] }));
		});

		it('should return true if teamName and userId are informed but rooms are undefined', () => {
			assert.isTrue(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: undefined }));
		});

		it('should return false if teamId and userId are informed and rooms are empty', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }));
		});

		it('should return true if teamId and userId are informed but rooms are undefined', () => {
			assert.isTrue(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: undefined }));
		});

		it('should return false if teamId and userId are informed but rooms are empty', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }));
		});

		it('should return true if teamId and userId are informed and rooms are informed', () => {
			assert.isTrue(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: ['room'] }));
		});

		it('should return false if teamId and userId are informed and rooms are informed but rooms is not an array of strings', () => {
			assert.isFalse(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [123] }));
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			assert.isFalse(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			);
		});

		it('should return false if teamId and userId are informed and rooms are informed but there is an extra property', () => {
			assert.isFalse(
				isTeamsRemoveMemberProps({
					teamId: 'teamId',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			);
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			assert.isFalse(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			);
		});
	});
});
