import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsAddMembersProps } from './TeamsAddMembersProps';

describe('TeamsAddMemberProps (definition/rest/v1)', () => {
	describe('isTeamsAddMembersProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsAddMembersProps, 'function');
		});
		it('should return false if the parameter is empty', () => {
			assert.equal(isTeamsAddMembersProps({}), false);
		});

		it('should return false if teamId is provided but no member was provided', () => {
			assert.equal(isTeamsAddMembersProps({ teamId: '123' }), false);
		});

		it('should return false if teamName is provided but no member was provided', () => {
			assert.equal(isTeamsAddMembersProps({ teamName: '123' }), false);
		});

		it('should return false if members is provided but no teamId or teamName were provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123' }] }), false);
		});

		it('should return false if teamName was provided but members are empty', () => {
			assert.equal(isTeamsAddMembersProps({ teamName: '123', members: [] }), false);
		});

		it('should return false if teamId was provided but members are empty', () => {
			assert.equal(isTeamsAddMembersProps({ teamId: '123', members: [] }), false);
		});

		it('should return false if members with role is provided but no teamId or teamName were provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }] }), false);
		});

		it('should return true if members is provided and teamId is provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamId: '123' }), true);
		});

		it('should return true if members is provided and teamName is provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamName: '123' }), true);
		});

		it('should return true if members with role is provided and teamId is provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamId: '123' }), true);
		});

		it('should return true if members with role is provided and teamName is provided', () => {
			assert.equal(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamName: '123' }), true);
		});

		it('should return false if teamName was provided and members contains an invalid property', () => {
			assert.equal(
				isTeamsAddMembersProps({
					teamName: '123',
					members: [{ userId: '123', roles: ['123'], invalid: true }],
				}),
				false,
			);
		});

		it('should return false if teamId was provided and members contains an invalid property', () => {
			assert.equal(
				isTeamsAddMembersProps({
					teamId: '123',
					members: [{ userId: '123', roles: ['123'], invalid: true }],
				}),
				false,
			);
		});

		it('should return false if teamName informed but contains an invalid property', () => {
			assert.equal(
				isTeamsAddMembersProps({
					member: [{ userId: '123', roles: ['123'] }],
					teamName: '123',
					invalid: true,
				}),
				false,
			);
		});

		it('should return false if teamId informed but contains an invalid property', () => {
			assert.equal(
				isTeamsAddMembersProps({
					member: [{ userId: '123', roles: ['123'] }],
					teamId: '123',
					invalid: true,
				}),
				false,
			);
		});
	});
});
