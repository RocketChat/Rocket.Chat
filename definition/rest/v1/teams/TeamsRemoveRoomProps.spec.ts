/* eslint-env mocha */
import chai from 'chai';

import { isTeamsRemoveRoomProps } from './TeamsRemoveRoomProps';

describe('TeamsRemoveRoomProps (definition/rest/v1)', () => {
	describe('isTeamsRemoveRoomProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsRemoveRoomProps);
		});
		it('should return false if roomId is not provided', () => {
			chai.assert.isFalse(isTeamsRemoveRoomProps({}));
		});
		it('should return false if roomId is provided but no teamId or teamName were provided', () => {
			chai.assert.isFalse(isTeamsRemoveRoomProps({ roomId: 'roomId' }));
		});
		it('should return false if roomId is provided and teamId is provided', () => {
			chai.assert.isTrue(isTeamsRemoveRoomProps({ roomId: 'roomId', teamId: 'teamId' }));
		});
		it('should return true if roomId is provided and teamName is provided', () => {
			chai.assert.isTrue(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName' }));
		});
		it('should return false if roomId and teamName are provided but an additional property is provided', () => {
			chai.assert.isFalse(isTeamsRemoveRoomProps({ roomId: 'roomId', teamName: 'teamName', foo: 'bar' }));
		});
	});
});
