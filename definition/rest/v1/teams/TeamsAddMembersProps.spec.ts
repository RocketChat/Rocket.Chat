/* eslint-env mocha */
import chai from 'chai';

import { isTeamsAddMembersProps } from './TeamsAddMembersProps';

describe('TeamsAddMemberProps (definition/rest/v1)', () => {
	describe('isTeamsAddMembersProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsAddMembersProps);
		});
		it('should return false if the parameter is empty', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({}));
		});

		it('should return false if teamId is provided but no member was provided', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamId: '123' }));
		});

		it('should return false if teamName is provided but no member was provided', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamName: '123' }));
		});

		it('should return false if members is provided but no teamId or teamName were provided', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ members: [{ userId: '123' }] }));
		});

		it('should return false if teamName was provided but members are empty', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamName: '123', members: [] }));
		});

		it('should return false if teamId was provided but members are empty', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamId: '123', members: [] }));
		});

		it('should return false if members with role is provided but no teamId or teamName were provided', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }] }));
		});

		it('should return true if members is provided and teamId is provided', () => {
			chai.assert.isTrue(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamId: '123' }));
		});

		it('should return true if members is provided and teamName is provided', () => {
			chai.assert.isTrue(isTeamsAddMembersProps({ members: [{ userId: '123' }], teamName: '123' }));
		});

		it('should return true if members with role is provided and teamId is provided', () => {
			chai.assert.isTrue(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamId: '123' }));
		});

		it('should return true if members with role is provided and teamName is provided', () => {
			chai.assert.isTrue(isTeamsAddMembersProps({ members: [{ userId: '123', roles: ['123'] }], teamName: '123' }));
		});

		it('should return false if teamName was provided and members contains an invalid property', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamName: '123', members: [{ userId: '123', roles: ['123'], invalid: true }] }));
		});

		it('should return false if teamId was provided and members contains an invalid property', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ teamId: '123', members: [{ userId: '123', roles: ['123'], invalid: true }] }));
		});

		it('should return false if teamName informed but contains an invalid property', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ member: [{ userId: '123', roles: ['123'] }], teamName: '123', invalid: true }));
		});

		it('should return false if teamId informed but contains an invalid property', () => {
			chai.assert.isFalse(isTeamsAddMembersProps({ member: [{ userId: '123', roles: ['123'] }], teamId: '123', invalid: true }));
		});
	});
});
