import { expect } from 'chai';
import { describe, it } from 'mocha';

import { IMessage } from '../../../../../../definition/IMessage';
import { messageReducer } from './useMessageList';

describe('messageReducer', () => {
	describe('upsert action', () => {
		it('should insert into empty list', () => {
			const initialState: IMessage[] = [];

			const newMessage: IMessage = {
				_id: 'xyz',
				_updatedAt: new Date(0),
				rid: 'general',
				msg: 'Hello world',
				ts: new Date(0),
				u: {
					_id: 'rocket.cat',
				},
			};

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([newMessage]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessage: IMessage = {
				_id: 'def',
				_updatedAt: new Date(0),
				rid: 'general',
				msg: 'Hello world',
				ts: new Date(0),
				u: {
					_id: 'rocket.cat',
				},
			};

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([...initialState, newMessage]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(1),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessage: IMessage = {
				_id: 'def',
				_updatedAt: new Date(0),
				rid: 'general',
				msg: 'Hello world',
				ts: new Date(0),
				u: {
					_id: 'rocket.cat',
				},
			};

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([initialState[0], newMessage, initialState[1]]);
		});

		it('should update message', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(1),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessage: IMessage = {
				_id: 'abc',
				_updatedAt: new Date(0),
				rid: 'general',
				msg: 'Hello world',
				ts: new Date(0),
				u: {
					_id: 'rocket.cat',
				},
			};

			const newState = messageReducer(initialState, {
				type: 'upsert',
				payload: newMessage,
			});

			expect(newState).to.be.deep.equals([initialState[0], newMessage]);
		});
	});

	describe('bulkUpsert action', () => {
		it('should insert into empty list', () => {
			const initialState: IMessage[] = [];

			const newMessages: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([newMessages[0], newMessages[1]]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessages: IMessage[] = [
				{
					_id: 'def',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'ghi',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([initialState[0], initialState[1], newMessages[0], newMessages[1]]);
		});

		it('should insert into non-empty list', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(1),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessages: IMessage[] = [
				{
					_id: 'def',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'ghi',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([initialState[0], newMessages[0], newMessages[1], initialState[1]]);
		});

		it('should update messages', () => {
			const initialState: IMessage[] = [
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world',
					ts: new Date(1),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newMessages: IMessage[] = [
				{
					_id: 'abc',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world #1',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
				{
					_id: 'xyz',
					_updatedAt: new Date(0),
					rid: 'general',
					msg: 'Hello world #2',
					ts: new Date(0),
					u: {
						_id: 'rocket.cat',
					},
				},
			];

			const newState = messageReducer(initialState, {
				type: 'bulkUpsert',
				payload: newMessages,
			});

			expect(newState).to.be.deep.equals([newMessages[1], newMessages[0]]);
		});
	});
});
