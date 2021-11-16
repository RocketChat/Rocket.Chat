/* eslint-env mocha */
import chai from 'chai';

import { isTeamsUpdateProps } from './TeamsUpdateProps';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateProps', () => {
		it('should be a function', () => {
			chai.assert.isFunction(isTeamsUpdateProps);
		});
		it('should return false when provided anything that is not an TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps(undefined));
			chai.assert.isFalse(isTeamsUpdateProps(null));
			chai.assert.isFalse(isTeamsUpdateProps(''));
			chai.assert.isFalse(isTeamsUpdateProps(123));
			chai.assert.isFalse(isTeamsUpdateProps({}));
			chai.assert.isFalse(isTeamsUpdateProps([]));
			chai.assert.isFalse(isTeamsUpdateProps(new Date()));
			chai.assert.isFalse(isTeamsUpdateProps(new Error()));
		});
		it('should return false when only teamName is provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamName: 'teamName',
			}));
		});

		it('should return false when only teamId is provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamId: 'teamId',
			}));
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is an empty object', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamName: 'teamName',
				data: {},
			}));
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is an empty object', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamId: 'teamId',
				data: {},
			}));
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is not an object', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamName: 'teamName',
				data: 'data',
			}));
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is not an object', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamId: 'teamId',
				data: 'data',
			}));
		});

		it('should return true when teamName and data.name are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamName: 'teamName',
				data: {
					name: 'name',
				},
			}));
		});

		it('should return true when teamId and data.name are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamId: 'teamId',
				data: {
					name: 'name',
				},
			}));
		});

		it('should return true when teamName and data.type are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamName: 'teamName',
				data: {
					type: 0,
				},
			}));
		});

		it('should return true when teamId and data.type are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamId: 'teamId',
				data: {
					type: 0,
				},
			}));
		});

		it('should return true when teamName and data.name and data.type are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamName: 'teamName',
				data: {
					name: 'name',
					type: 0,
				},
			}));
		});

		it('should return true when teamId and data.name and data.type are provided to TeamsUpdateProps', () => {
			chai.assert.isTrue(isTeamsUpdateProps({
				teamId: 'teamId',
				data: {
					name: 'name',
					type: 0,
				},
			}));
		});

		it('should return false when teamName, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamName: 'teamName',
				data: {
					name: 'name',
					type: 0,
					extra: 'extra',
				},
			}));
		});

		it('should return false when teamId, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamId: 'teamId',
				data: {
					name: 'name',
					type: 0,
					extra: 'extra',
				},
			}));
		});

		it('should return false when teamName, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamName: 'teamName',
				extra: 'extra',
				data: {
					name: 'name',
					type: 0,
				},
			}));
		});

		it('should return false when teamId, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			chai.assert.isFalse(isTeamsUpdateProps({
				teamId: 'teamId',
				extra: 'extra',
				data: {
					name: 'name',
					type: 0,
				},
			}));
		});
	});
});
