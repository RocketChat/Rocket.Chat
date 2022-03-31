import { isTeamsLeaveProps } from './TeamsLeaveProps';

describe('TeamsLeaveProps (definition/rest/v1)', () => {
	describe('isTeamsLeaveProps', () => {
		it('should return false if neither teamName or teamId is provided', () => {
			expect(isTeamsLeaveProps({})).toBeFalsy();
		});

		it('should return true if teamId is provided', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId' })).toBeTruthy();
		});

		it('should return true if teamName is provided', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName' })).toBeTruthy();
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: [] })).toBeFalsy();
		});

		it('should return true if teamId are provided, but rooms are undefined', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: undefined })).toBeTruthy();
		});

		it('should return false if teamName and rooms are provided, but rooms is empty', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: [] })).toBeFalsy();
		});

		it('should return true if teamName are provided, but rooms are undefined', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: undefined })).toBeTruthy();
		});

		it('should return true if teamId and rooms are provided', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['roomId'] })).toBeTruthy();
		});

		it('should return true if teamName and rooms are provided', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['roomId'] })).toBeTruthy();
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: {} })).toBeFalsy();
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: {} })).toBeFalsy();
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array of strings', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: [1] })).toBeFalsy();
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array of strings', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: [1] })).toBeFalsy();
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			expect(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['rooms'], extra: 'extra' })).toBeFalsy();
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			expect(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['rooms'], extra: 'extra' })).toBeFalsy();
		});
	});
});
