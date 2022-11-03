import { assert } from 'chai';
import { isTeamsUpdateMemberProps } from '@rocket.chat/rest-typings';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateMemberProps', () => {
		it('should be a function', () => {
			assert.isFunction(isTeamsUpdateMemberProps);
		});
		it('should return false if the parameter is empty', () => {
			assert.isFalse(isTeamsUpdateMemberProps({}));
		});

		it('should return false if teamId is provided but no member was provided', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ teamId: '123' }));
		});

		it('should return false if teamName is provided but no member was provided', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ teamName: '123' }));
		});

		it('should return false if member is provided but no teamId or teamName were provided', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ member: { userId: '123' } }));
		});

		it('should return false if member with role is provided but no teamId or teamName were provided', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] } }));
		});

		it('should return true if member is provided and teamId is provided', () => {
			assert.isTrue(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamId: '123' }));
		});

		it('should return true if member is provided and teamName is provided', () => {
			assert.isTrue(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamName: '123' }));
		});

		it('should return true if member with role is provided and teamId is provided', () => {
			assert.isTrue(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamId: '123' }));
		});

		it('should return true if member with role is provided and teamName is provided', () => {
			assert.isTrue(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamName: '123' }));
		});

		it('should return false if teamName was provided and member contains an invalid property', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamName: '123' }));
		});

		it('should return false if teamId was provided and member contains an invalid property', () => {
			assert.isFalse(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamId: '123' }));
		});

		it('should return false if contains an invalid property', () => {
			assert.isFalse(
				isTeamsUpdateMemberProps({
					member: { userId: '123', roles: ['123'] },
					teamName: '123',
					invalid: true,
				}),
			);
		});
	});
});
