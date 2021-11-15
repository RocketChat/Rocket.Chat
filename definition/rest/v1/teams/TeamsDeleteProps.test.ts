/* eslint-env mocha */
import chai from 'chai';

import { isTeamsDeleteProps } from './TeamsDeleteProps';

describe('TeamsDeleteProps (definition/rest/v1)', () => {
	describe('isTeamsDeleteProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsDeleteProps);
		});

		it('should return false if neither teamName or teamId is provided', () => {
			chai.assert.isFalse(isTeamsDeleteProps({}));
		});

		it('should return true if teamId is provided', () => {
			chai.assert.isTrue(isTeamsDeleteProps({ teamId: 'teamId' }));
		});

		it('should return true if teamName is provided', () => {
			chai.assert.isTrue(isTeamsDeleteProps({ teamName: 'teamName' }));
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: [] }));
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is empty', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: [] }));
		});

		it('should return true if teamId and roomsToRemove are provided', () => {
			chai.assert.isTrue(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomId'] }));
		});

		it('should return true if teamName and roomsToRemove are provided', () => {
			chai.assert.isTrue(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: ['roomId'] }));
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: {} }));
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: {} }));
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is not an array of strings', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: [1] }));
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is not an array of strings', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: [1] }));
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: ['roomsToRemove'], extra: 'extra' }));
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			chai.assert.isFalse(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomsToRemove'], extra: 'extra' }));
		});
	});
});
