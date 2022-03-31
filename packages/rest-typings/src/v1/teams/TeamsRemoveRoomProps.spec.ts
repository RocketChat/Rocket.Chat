import { isTeamsRemoveRoomProps } from './TeamsRemoveRoomProps';

describe('TeamsRemoveRoomProps (definition/rest/v1)', () => {
	describe('isTeamsRemoveRoomProps', () => {
		it('should return false if roomId is not provided', () => {
			expect(isTeamsRemoveRoomProps({})).toBeFalsy();
		});
		it('should return false if roomId is provided but no teamId or teamName were provided', () => {
			expect(isTeamsRemoveRoomProps({ roomId: 'roomId' })).toBeFalsy();
		});
		it('should return false if roomId is provided and teamId is provided', () => {
			expect(isTeamsRemoveRoomProps({ roomId: 'roomId', teamId: 'teamId' })).toBeTruthy();
		});
		it('should return true if roomId is provided and teamName is provided', () => {
			expect(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName' })).toBeTruthy();
		});
		it('should return false if roomId and teamName are provided but an additional property is provided', () => {
			expect(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName', foo: 'bar' })).toBeFalsy();
		});
	});
});
