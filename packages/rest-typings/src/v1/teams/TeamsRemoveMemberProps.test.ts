import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsRemoveMemberProps } from './TeamsRemoveMemberProps';

describe('Teams (definition/rest/v1)', () => {
	describe('isTeamsRemoveMemberProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsRemoveMemberProps, 'function');
		});
		it('should return false if parameter is empty', () => {
			assert.equal(isTeamsRemoveMemberProps({}), false);
		});
		it('should return false if teamId is is informed but missing userId', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId' }), false);
		});
		it('should return false if teamName is is informed but missing userId', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamName: 'teamName' }), false);
		});

		it('should return true if teamId and userId are informed', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId' }), true);
		});
		it('should return true if teamName and userId are informed', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId' }), true);
		});

		it('should return false if teamName and userId are informed but rooms are empty', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: [] }), false);
		});

		it('should return true if teamName and userId are informed but rooms are undefined', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: undefined }), true);
		});

		it('should return false if teamId and userId are informed and rooms are empty', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }), false);
		});

		it('should return true if teamId and userId are informed but rooms are undefined', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: undefined }), true);
		});

		it('should return false if teamId and userId are informed but rooms are empty', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] }), false);
		});

		it('should return true if teamId and userId are informed and rooms are informed', () => {
			assert.equal(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: ['room'] }), true);
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			assert.equal(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
				false,
			);
		});

		it('should return false if teamId and userId are informed and rooms are informed but there is an extra property', () => {
			assert.equal(
				isTeamsRemoveMemberProps({
					teamId: 'teamId',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
				false,
			);
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			assert.equal(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
				false,
			);
		});
	});
});
