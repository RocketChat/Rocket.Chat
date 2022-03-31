import { isTeamsAddMembersProps } from './TeamsAddMembersProps';

describe('TeamsAddMemberProps (definition/rest/v1)', () => {
	describe('isTeamsAddMembersProps', () => {
		it('should return false if the parameter is empty', () => {
			expect(isTeamsAddMembersProps({})).toBeFalsy();
		});

		it('should return false if teamId is provided but no member was provided', () => {
			expect(isTeamsAddMembersProps({ teamId: '123' })).toBeFalsy();
		});

		it('should return false if teamName is provided but no member was provided', () => {
			expect(isTeamsAddMembersProps({ teamName: '123' })).toBeFalsy();
		});

		it('should return false if members is provided but no teamId or teamName were provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123' }] })).toBeFalsy();
		});

		it('should return false if teamName was provided but members are empty', () => {
			expect(isTeamsAddMembersProps({ teamName: '123', members: [] })).toBeFalsy();
		});

		it('should return false if teamId was provided but members are empty', () => {
			expect(isTeamsAddMembersProps({ teamId: '123', members: [] })).toBeFalsy();
		});

		it('should return false if members with role is provided but no teamId or teamName were provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }] })).toBeFalsy();
		});

		it('should return true if members is provided and teamId is provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamId: '123' })).toBeTruthy();
		});

		it('should return true if members is provided and teamName is provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamName: '123' })).toBeTruthy();
		});

		it('should return true if members with role is provided and teamId is provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamId: '123' })).toBeTruthy();
		});

		it('should return true if members with role is provided and teamName is provided', () => {
			expect(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamName: '123' })).toBeTruthy();
		});

		it('should return false if teamName was provided and members contains an invalid property', () => {
			expect(
				isTeamsAddMembersProps({
					teamName: '123',
					members: [{ userId: '123', roles: ['123'], invalid: true }],
				}),
			).toBeFalsy();
		});

		it('should return false if teamId was provided and members contains an invalid property', () => {
			expect(
				isTeamsAddMembersProps({
					teamId: '123',
					members: [{ userId: '123', roles: ['123'], invalid: true }],
				}),
			).toBeFalsy();
		});

		it('should return false if teamName informed but contains an invalid property', () => {
			expect(
				isTeamsAddMembersProps({
					member: [{ userId: '123', roles: ['123'] }],
					teamName: '123',
					invalid: true,
				}),
			).toBeFalsy();
		});

		it('should return false if teamId informed but contains an invalid property', () => {
			expect(
				isTeamsAddMembersProps({
					member: [{ userId: '123', roles: ['123'] }],
					teamId: '123',
					invalid: true,
				}),
			).toBeFalsy();
		});
	});
});
