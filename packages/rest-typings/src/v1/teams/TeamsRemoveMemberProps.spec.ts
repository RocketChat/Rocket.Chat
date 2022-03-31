import { isTeamsRemoveMemberProps } from './TeamsRemoveMemberProps';

describe('Teams (definition/rest/v1)', () => {
	describe('isTeamsRemoveMemberProps', () => {
		it('should return false if parameter is empty', () => {
			expect(isTeamsRemoveMemberProps({})).toBeFalsy();
		});
		it('should return false if teamId is is informed but missing userId', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId' })).toBeFalsy();
		});
		it('should return false if teamName is is informed but missing userId', () => {
			expect(isTeamsRemoveMemberProps({ teamName: 'teamName' })).toBeFalsy();
		});

		it('should return true if teamId and userId are informed', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId' })).toBeTruthy();
		});
		it('should return true if teamName and userId are informed', () => {
			expect(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId' })).toBeTruthy();
		});

		it('should return false if teamName and userId are informed but rooms are empty', () => {
			expect(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: [] })).toBeFalsy();
		});

		it('should return true if teamName and userId are informed but rooms are undefined', () => {
			expect(isTeamsRemoveMemberProps({ teamName: 'teamName', userId: 'userId', rooms: undefined })).toBeTruthy();
		});

		it('should return false if teamId and userId are informed and rooms are empty', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] })).toBeFalsy();
		});

		it('should return true if teamId and userId are informed but rooms are undefined', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: undefined })).toBeTruthy();
		});

		it('should return false if teamId and userId are informed but rooms are empty', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [] })).toBeFalsy();
		});

		it('should return true if teamId and userId are informed and rooms are informed', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: ['room'] })).toBeTruthy();
		});

		it('should return false if teamId and userId are informed and rooms are informed but rooms is not an array of strings', () => {
			expect(isTeamsRemoveMemberProps({ teamId: 'teamId', userId: 'userId', rooms: [123] })).toBeFalsy();
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			expect(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			).toBeFalsy();
		});

		it('should return false if teamId and userId are informed and rooms are informed but there is an extra property', () => {
			expect(
				isTeamsRemoveMemberProps({
					teamId: 'teamId',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			).toBeFalsy();
		});

		it('should return false if teamName and userId are informed and rooms are informed but there is an extra property', () => {
			expect(
				isTeamsRemoveMemberProps({
					teamName: 'teamName',
					userId: 'userId',
					rooms: ['room'],
					extra: 'extra',
				}),
			).toBeFalsy();
		});
	});
});
