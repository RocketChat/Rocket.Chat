import { after, before, describe, it, mock } from 'node:test';

import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let RoomMessage: (typeof import('./RoomMessage'))['default'];
let MessageListContext: (typeof import('../list/MessageListContext'))['MessageListContext'];
let messageListContextDefaultValue: (typeof import('../list/MessageListContext'))['messageListContextDefaultValue'];

const message: IMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message body',
	md: [
		{
			type: 'PARAGRAPH',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: 'message body',
				},
			],
		},
	],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
};

describe('RoomMessage', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../hooks/useUserRolesByScope', {
			exports: {
				useUserRolesByScope: () => ({ workspaceRoles: [], roomRoles: [] }),
			},
		});
		mock.module('../../../lib/utils/fireGlobalEvent', {
			exports: {
				fireGlobalEvent: () => undefined,
			},
		});
		mock.module('../../../views/room/hooks/useGoToRoom', {
			exports: {
				useGoToRoom: () => undefined,
			},
		});
		mock.module('../../../views/room/contextualBar/Threads/hooks/useGetMessageByID', { exports: { default: (() => undefined)() } });
		mock.module('../../../views/room/MessageList/hooks/useAutoTranslate', {
			exports: {
				useAutoTranslate: () => ({
					autoTranslateEnabled: false,
					autoTranslateLanguage: '',
					showAutoTranslate: () => false,
				}),
			},
		});
		mock.module('../../../lib/actionLinks', { exports: { default: (() => undefined)() } });
		mock.module('../../../lib/RoomManager', {
			exports: {
				RoomManager: { getStore: fn<FunctionLike>() },
				useOpenedRoom: () => undefined,
				getCollapsibleEventKey: (key: string) => `collapsibleToggled-${key}`,
			},
		});
		({ default: RoomMessage } = require('./RoomMessage'));
		({ MessageListContext, messageListContextDefaultValue } = require('../list/MessageListContext'));
	});

	after(leaveModuleScope);

	it('should show normal message', () => {
		render(
			<RoomMessage
				message={message}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.getByText('message body')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
	});

	it('should show fallback content for ignored user', () => {
		render(
			<RoomMessage
				message={message}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={true}
				showUserAvatar={true}
			/>,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	});

	it('should show ignored message', () => {
		render(
			<RoomMessage
				message={{ ...message, ignored: true }}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	});

	it('should show read receipt', () => {
		render(
			<RoomMessage
				message={message}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
			{
				wrapper: mockAppRoot()
					.wrap((children) => (
						<MessageListContext.Provider value={{ ...messageListContextDefaultValue, readReceipts: { enabled: true, storeUsers: false } }}>
							{children}
						</MessageListContext.Provider>
					))
					.build(),
			},
		);

		expect(screen.getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
	});

	it('should not show read receipt if receipt is disabled', () => {
		render(
			<RoomMessage
				message={message}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
			{
				wrapper: mockAppRoot()
					.wrap((children) => (
						<MessageListContext.Provider value={{ ...messageListContextDefaultValue, readReceipts: { enabled: false, storeUsers: false } }}>
							{children}
						</MessageListContext.Provider>
					))
					.build(),
			},
		);

		expect(screen.queryByRole('status', { name: 'Message_viewed' })).not.toBeInTheDocument();
	});
});
