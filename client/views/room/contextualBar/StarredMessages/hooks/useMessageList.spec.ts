import { expect } from 'chai';
import { describe, it } from 'mocha';

import { IMessage } from '../../../../../../definition/IMessage';
import { messageReducer } from './useMessageList';

const abc: IMessage = Object.freeze({
	_id: 'abc',
	_updatedAt: new Date(0),
	rid: 'general',
	msg: 'Hello world',
	ts: new Date(0),
	u: {
		_id: 'rocket.cat',
	},
});

const def: IMessage = Object.freeze({
	_id: 'def',
	_updatedAt: new Date(0),
	rid: 'general',
	msg: 'Hello world',
	ts: new Date(0),
	u: {
		_id: 'rocket.cat',
	},
});

const ghi: IMessage = Object.freeze({
	_id: 'ghi',
	_updatedAt: new Date(0),
	rid: 'general',
	msg: 'Hello world',
	ts: new Date(0),
	u: {
		_id: 'rocket.cat',
	},
});

const xyz: IMessage = Object.freeze({
	_id: 'xyz',
	_updatedAt: new Date(0),
	rid: 'general',
	msg: 'Hello world',
	ts: new Date(1),
	u: {
		_id: 'rocket.cat',
	},
});

describe('messageReducer', () => {
	describe('upsert action', () => {
		it('should insert into empty list', () => {
			const initialState: IMessage[] = [];

			const newMessage: IMessage = xyz;

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([xyz]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [xyz, abc];

			const newMessage: IMessage = def;

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([xyz, def, abc]);
		});

		it('should update message', () => {
			const abcUpdated = { ...abc, ts: new Date(2) };

			const initialState: IMessage[] = [xyz, abc];

			const newMessage: IMessage = abcUpdated;

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([abcUpdated, xyz]);
		});
	});

	describe('bulkUpsert action', () => {
		it('should insert into empty list', () => {
			const initialState: IMessage[] = [];

			const newMessages: IMessage[] = [xyz, abc];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([xyz, abc]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [abc];

			const newMessages: IMessage[] = [ghi, def];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([ghi, def, abc]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [xyz, abc];

			const newMessages: IMessage[] = [ghi, def];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([xyz, ghi, def, abc]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [abc, def];

			const newMessages: IMessage[] = [ghi, xyz];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([xyz, ghi, abc, def]);
		});

		it('should update messages', () => {
			const abcUpdated = { ...abc, msg: 'Edit', ts: new Date(2) };
			const xyzUpdated = { ...xyz, msg: 'Edit' };

			const initialState: IMessage[] = [xyz, abc];

			const newMessages: IMessage[] = [abcUpdated, xyzUpdated];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([abcUpdated, xyzUpdated]);
		});
	});
});
