import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsRemoveRoomProps } from './TeamsRemoveRoomProps';

describe('TeamsRemoveRoomProps (definition/rest/v1)', () => {
	describe('isTeamsRemoveRoomProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsRemoveRoomProps, 'function');
		});
		it('should return false if roomId is not provided', () => {
			assert.equal(isTeamsRemoveRoomProps({}), false);
		});
		it('should return false if roomId is provided but no teamId or teamName were provided', () => {
			assert.equal(isTeamsRemoveRoomProps({ roomId: 'roomId' }), false);
		});
		it('should return false if roomId is provided and teamId is provided', () => {
			assert.equal(isTeamsRemoveRoomProps({ roomId: 'roomId', teamId: 'teamId' }), true);
		});
		it('should return true if roomId is provided and teamName is provided', () => {
			assert.equal(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName' }), true);
		});
		it('should return false if roomId and teamName are provided but an additional property is provided', () => {
			assert.equal(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName', foo: 'bar' }), false);
		});
	});
});
