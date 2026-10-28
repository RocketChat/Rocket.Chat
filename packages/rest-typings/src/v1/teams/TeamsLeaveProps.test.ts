import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsLeaveProps } from './TeamsLeaveProps';

describe('TeamsLeaveProps (definition/rest/v1)', () => {
	describe('isTeamsLeaveProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsLeaveProps, 'function');
		});

		it('should return false if neither teamName or teamId is provided', () => {
			assert.equal(isTeamsLeaveProps({}), false);
		});

		it('should return true if teamId is provided', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId' }), true);
		});

		it('should return true if teamName is provided', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName' }), true);
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId', rooms: [] }), false);
		});

		it('should return true if teamId are provided, but rooms are undefined', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId', rooms: undefined }), true);
		});

		it('should return false if teamName and rooms are provided, but rooms is empty', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName', rooms: [] }), false);
		});

		it('should return true if teamName are provided, but rooms are undefined', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName', rooms: undefined }), true);
		});

		it('should return true if teamId and rooms are provided', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['roomId'] }), true);
		});

		it('should return true if teamName and rooms are provided', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['roomId'] }), true);
		});

		it('should return false if teamId and rooms are provided, but rooms is not an array', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId', rooms: {} }), false);
		});

		it('should return false if teamName and rooms are provided, but rooms is not an array', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName', rooms: {} }), false);
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			assert.equal(isTeamsLeaveProps({ teamName: 'teamName', rooms: ['rooms'], extra: 'extra' }), false);
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			assert.equal(isTeamsLeaveProps({ teamId: 'teamId', rooms: ['rooms'], extra: 'extra' }), false);
		});
	});
});
