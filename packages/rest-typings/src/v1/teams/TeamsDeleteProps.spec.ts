import { isTeamsDeleteProps } from './TeamsDeleteProps';

describe('TeamsDeleteProps (definition/rest/v1)', () => {
	describe('isTeamsDeleteProps', () => {
		it('should return false if neither teamName or teamId is provided', () => {
			expect(isTeamsDeleteProps({})).toBeFalsy();
		});

		it('should return true if teamId is provided', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId' })).toBeTruthy();
		});

		it('should return true if teamName is provided', () => {
			expect(isTeamsDeleteProps({ teamName: 'teamName' })).toBeTruthy();
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: [] })).toBeFalsy();
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is empty', () => {
			expect(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: [] })).toBeFalsy();
		});

		it('should return true if teamId and roomsToRemove are provided', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomId'] })).toBeTruthy();
		});

		it('should return true if teamName and roomsToRemove are provided', () => {
			expect(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: ['roomId'] })).toBeTruthy();
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: {} })).toBeFalsy();
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			expect(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: {} })).toBeFalsy();
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is not an array of strings', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: [1] })).toBeFalsy();
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is not an array of strings', () => {
			expect(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: [1] })).toBeFalsy();
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			expect(
				isTeamsDeleteProps({
					teamName: 'teamName',
					roomsToRemove: ['roomsToRemove'],
					extra: 'extra',
				}),
			).toBeFalsy();
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			expect(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomsToRemove'], extra: 'extra' })).toBeFalsy();
		});
	});
});
