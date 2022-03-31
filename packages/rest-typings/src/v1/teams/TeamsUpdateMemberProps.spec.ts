import { isTeamsUpdateMemberProps } from './TeamsUpdateMemberProps';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateMemberProps', () => {
		it('should return false if the parameter is empty', () => {
			expect(isTeamsUpdateMemberProps({})).toBeFalsy();
		});

		it('should return false if teamId is provided but no member was provided', () => {
			expect(isTeamsUpdateMemberProps({ teamId: '123' })).toBeFalsy();
		});

		it('should return false if teamName is provided but no member was provided', () => {
			expect(isTeamsUpdateMemberProps({ teamName: '123' })).toBeFalsy();
		});

		it('should return false if member is provided but no teamId or teamName were provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123' } })).toBeFalsy();
		});

		it('should return false if member with role is provided but no teamId or teamName were provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] } })).toBeFalsy();
		});

		it('should return true if member is provided and teamId is provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamId: '123' })).toBeTruthy();
		});

		it('should return true if member is provided and teamName is provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamName: '123' })).toBeTruthy();
		});

		it('should return true if member with role is provided and teamId is provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamId: '123' })).toBeTruthy();
		});

		it('should return true if member with role is provided and teamName is provided', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamName: '123' })).toBeTruthy();
		});

		it('should return false if teamName was provided and member contains an invalid property', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamName: '123' })).toBeFalsy();
		});

		it('should return false if teamId was provided and member contains an invalid property', () => {
			expect(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamId: '123' })).toBeFalsy();
		});

		it('should return false if contains an invalid property', () => {
			expect(
				isTeamsUpdateMemberProps({
					member: { userId: '123', roles: ['123'] },
					teamName: '123',
					invalid: true,
				}),
			).toBeFalsy();
		});
	});
});
