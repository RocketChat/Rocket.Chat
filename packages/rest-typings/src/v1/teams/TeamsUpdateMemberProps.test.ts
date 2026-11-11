import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsUpdateMemberProps } from './TeamsUpdateMemberProps';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateMemberProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsUpdateMemberProps, 'function');
		});
		it('should return false if the parameter is empty', () => {
			assert.equal(isTeamsUpdateMemberProps({}), false);
		});

		it('should return false if teamId is provided but no member was provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ teamId: '123' }), false);
		});

		it('should return false if teamName is provided but no member was provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ teamName: '123' }), false);
		});

		it('should return false if member is provided but no teamId or teamName were provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123' } }), false);
		});

		it('should return false if member with role is provided but no teamId or teamName were provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] } }), false);
		});

		it('should return true if member is provided and teamId is provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamId: '123' }), true);
		});

		it('should return true if member is provided and teamName is provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123' }, teamName: '123' }), true);
		});

		it('should return true if member with role is provided and teamId is provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamId: '123' }), true);
		});

		it('should return true if member with role is provided and teamName is provided', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123', roles: ['123'] }, teamName: '123' }), true);
		});

		it('should return false if teamName was provided and member contains an invalid property', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamName: '123' }), false);
		});

		it('should return false if teamId was provided and member contains an invalid property', () => {
			assert.equal(isTeamsUpdateMemberProps({ member: { userId: '123', invalid: '123' }, teamId: '123' }), false);
		});

		it('should return false if contains an invalid property', () => {
			assert.equal(
				isTeamsUpdateMemberProps({
					member: { userId: '123', roles: ['123'] },
					teamName: '123',
					invalid: true,
				}),
				false,
			);
		});
	});
});
