import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const AppEvents = {
	IUIKitInteractionHandler: 'IUIKitInteractionHandler',
	IUIKitLivechatInteractionHandler: 'IUIKitLivechatInteractionHandler',
};

const { AppUIKitInteractionApi } = proxyquire.noCallThru().load('./uikit', {
	'@rocket.chat/apps': { AppEvents },
	'@rocket.chat/core-services': { UiKitCoreApp: { isRegistered: sinon.stub() } },
	'@rocket.chat/http-router': { nodeHandler: () => () => undefined },
	'@rocket.chat/logger': { Logger: class {} },
	'../../../../server/api/v1/middlewares/authentication': { authenticationMiddleware: () => () => undefined },
	'../../../../server/api/v1/middlewares/logger': { nodeLoggerMiddleware: () => () => undefined },
	'../../../../server/lib/http/httpServer': { httpApp: { use: sinon.stub() } },
	'../../../../server/lib/uikit/confirmViewFiles': { confirmViewFiles: sinon.stub().resolves() },
	'../../../../server/lib/uikit/interactionResponses': { 'withDefaultCloseTarget': sinon.stub().resolves(), '@noCallThru': false },
	'../../../../server/lib/uikit/recordedViews': {
		recordInteractionView: sinon.stub().resolves(true),
		withRecordedView: async (view: unknown) => view,
	},
	'../../../../server/lib/uikit/reportInvalidBlocks': { reportInvalidInteractionBlocks: sinon.stub().returns(false) },
	'../../../../server/settings': { settings: { watch: sinon.stub(), get: sinon.stub() } },
	'../../lib/apps/orchestrator': { Apps: {} },
});

const convertToApp = sinon.stub();
const convertMessageById = sinon.stub();
const convertRoomById = sinon.stub();
const triggerEvent = sinon.stub();
const getConverters = sinon.stub();

const orch = { getConverters, triggerEvent };

const reqUser = { _id: 'user-id', username: 'user' };
const appUser = { id: 'user-id', username: 'user' };
const appMessage = { id: 'message-id' };
const appRoom = { id: 'room-id' };

const buildRes = () => {
	const res = { send: sinon.stub(), status: sinon.stub() };
	res.status.returns(res);
	return res;
};

describe('AppUIKitInteractionApi routeHandler', () => {
	let api: InstanceType<typeof AppUIKitInteractionApi>;
	let res: ReturnType<typeof buildRes>;

	beforeEach(() => {
		convertToApp.reset();
		convertMessageById.reset();
		convertRoomById.reset();
		triggerEvent.reset();
		getConverters.reset();

		convertToApp.returns(appUser);
		convertMessageById.resolves(appMessage);
		convertRoomById.resolves(appRoom);
		triggerEvent.resolves({ success: true });
		getConverters.returns(
			new Map<string, unknown>([
				['users', { convertToApp }],
				['messages', { convertById: convertMessageById }],
				['rooms', { convertById: convertRoomById }],
			]),
		);

		api = new AppUIKitInteractionApi(orch);
		res = buildRes();
	});

	describe('blockAction', () => {
		it('triggers the interaction handler with the converted user, message and room and sends the result', async () => {
			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: { blockId: 'block-id', value: 'value' },
						container: { type: 'message', id: 'container-id' },
						mid: 'message-id',
						rid: 'room-id',
					},
				},
				res,
			);

			expect(convertToApp.calledOnceWithExactly(reqUser)).to.equal(true);
			expect(convertMessageById.calledOnceWithExactly('message-id')).to.equal(true);
			expect(convertRoomById.calledOnceWithExactly('room-id')).to.equal(true);
			sinon.assert.callOrder(convertToApp, convertMessageById, convertRoomById, triggerEvent);
			expect(triggerEvent.args).to.deep.equal([
				[
					'IUIKitInteractionHandler',
					{
						type: 'blockAction',
						container: { type: 'message', id: 'container-id' },
						appId: 'app-id',
						actionId: 'action-id',
						message: appMessage,
						triggerId: 'trigger-id',
						payload: { blockId: 'block-id', value: 'value' },
						user: appUser,
						visitor: undefined,
						room: appRoom,
					},
				],
			]);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
			expect(res.status.called).to.equal(false);
		});

		it('triggers the livechat interaction handler with the visitor when the body has a visitor', async () => {
			const visitor = { id: 'visitor-id', username: 'guest', token: 'visitor-token' };

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: undefined,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: {},
						container: { type: 'view', id: 'view-id' },
						rid: 'room-id',
						visitor,
					},
				},
				res,
			);

			expect(triggerEvent.firstCall.args[0]).to.equal('IUIKitLivechatInteractionHandler');
			expect(triggerEvent.firstCall.args[1].visitor).to.equal(visitor);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
		});

		it('skips message and room conversion when the body has no mid or rid', async () => {
			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: {},
						container: { type: 'view', id: 'view-id' },
					},
				},
				res,
			);

			expect(convertMessageById.called).to.equal(false);
			expect(convertRoomById.called).to.equal(false);
			expect(triggerEvent.firstCall.args[1].message).to.equal(undefined);
			expect(triggerEvent.firstCall.args[1].room).to.equal(undefined);
		});

		it('triggers the event with undefined user, message and room when there are no converters', async () => {
			getConverters.returns(undefined);

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: {},
						container: { type: 'message', id: 'container-id' },
						mid: 'message-id',
						rid: 'room-id',
					},
				},
				res,
			);

			expect(triggerEvent.firstCall.args[1].user).to.equal(undefined);
			expect(triggerEvent.firstCall.args[1].message).to.equal(undefined);
			expect(triggerEvent.firstCall.args[1].room).to.equal(undefined);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
		});

		it('responds 500 with the error message when the event handler throws an Error', async () => {
			triggerEvent.rejects(new Error('handler failed'));

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: {},
						container: { type: 'view', id: 'view-id' },
					},
				},
				res,
			);

			expect(res.status.calledOnceWithExactly(500)).to.equal(true);
			expect(res.send.calledOnceWithExactly({ error: 'handler failed' })).to.equal(true);
		});

		it('responds 500 with the thrown value when the event handler throws a non-Error', async () => {
			triggerEvent.returns(Promise.reject({ code: 'boom' }));

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'blockAction',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload: {},
						container: { type: 'view', id: 'view-id' },
					},
				},
				res,
			);

			expect(res.status.calledOnceWithExactly(500)).to.equal(true);
			expect(res.send.calledOnceWithExactly({ error: { code: 'boom' } })).to.equal(true);
		});

		it('rejects without responding when converting the message fails', async () => {
			convertMessageById.rejects(new Error('conversion failed'));

			await expect(
				api.routeHandler(
					{
						params: { id: 'app-id' },
						user: reqUser,
						body: {
							type: 'blockAction',
							actionId: 'action-id',
							triggerId: 'trigger-id',
							payload: {},
							container: { type: 'message', id: 'container-id' },
							mid: 'message-id',
							rid: 'room-id',
						},
					},
					res,
				),
			).to.be.rejectedWith('conversion failed');
			expect(convertRoomById.called).to.equal(false);
			expect(triggerEvent.called).to.equal(false);
			expect(res.send.called).to.equal(false);
		});
	});

	describe('viewClosed', () => {
		it('triggers the interaction handler with the view and isCleared and sends the result', async () => {
			const view = { id: 'view-id' };

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'viewClosed', rid: 'room-id', payload: { view, isCleared: true }, triggerId: 'trigger-id' },
				},
				res,
			);

			expect(convertRoomById.calledOnceWithExactly('room-id')).to.equal(true);
			expect(triggerEvent.args).to.deep.equal([
				[
					'IUIKitInteractionHandler',
					{
						type: 'viewClosed',
						appId: 'app-id',
						triggerId: 'trigger-id',
						user: appUser,
						visitor: undefined,
						room: appRoom,
						payload: { view, isCleared: true },
					},
				],
			]);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
		});

		it('skips room conversion when the body has no rid', async () => {
			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'viewClosed', payload: { view: { id: 'view-id' } } },
				},
				res,
			);

			expect(convertRoomById.called).to.equal(false);
			expect(triggerEvent.firstCall.args[1].room).to.equal(undefined);
		});

		it('responds 500 with the error message when the event handler throws', async () => {
			triggerEvent.rejects(new Error('handler failed'));

			await api.routeHandler(
				{ params: { id: 'app-id' }, user: reqUser, body: { type: 'viewClosed', payload: { view: { id: 'view-id' } } } },
				res,
			);

			expect(res.status.calledOnceWithExactly(500)).to.equal(true);
			expect(res.send.calledOnceWithExactly({ error: 'handler failed' })).to.equal(true);
		});
	});

	describe('viewSubmit', () => {
		it('triggers the interaction handler with the payload and sends the result', async () => {
			const payload = { view: { id: 'view-id', state: {} } };

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'viewSubmit', actionId: 'action-id', triggerId: 'trigger-id', payload, rid: 'room-id' },
				},
				res,
			);

			expect(triggerEvent.args).to.deep.equal([
				[
					'IUIKitInteractionHandler',
					{
						type: 'viewSubmit',
						appId: 'app-id',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						payload,
						user: appUser,
						visitor: undefined,
						room: appRoom,
					},
				],
			]);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
		});

		it('responds 500 with the error message when the event handler throws', async () => {
			triggerEvent.rejects(new Error('handler failed'));

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'viewSubmit', actionId: 'action-id', triggerId: 'trigger-id', payload: { view: {} } },
				},
				res,
			);

			expect(convertRoomById.called).to.equal(false);
			expect(res.status.calledOnceWithExactly(500)).to.equal(true);
			expect(res.send.calledOnceWithExactly({ error: 'handler failed' })).to.equal(true);
		});
	});

	describe('actionButton', () => {
		it('triggers the interaction handler with the converted room and message, tmid and message text', async () => {
			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: {
						type: 'actionButton',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						rid: 'room-id',
						mid: 'message-id',
						tmid: 'thread-id',
						payload: { context: 'messageBoxAction', message: 'typed text' },
					},
				},
				res,
			);

			sinon.assert.callOrder(convertToApp, convertRoomById, convertMessageById, triggerEvent);
			expect(triggerEvent.args).to.deep.equal([
				[
					'IUIKitInteractionHandler',
					{
						type: 'actionButton',
						appId: 'app-id',
						actionId: 'action-id',
						triggerId: 'trigger-id',
						user: appUser,
						room: appRoom,
						message: appMessage,
						tmid: 'thread-id',
						payload: { context: 'messageBoxAction', message: 'typed text' },
					},
				],
			]);
			expect(res.send.calledOnceWithExactly({ success: true })).to.equal(true);
		});

		it('omits the message text from the payload when there is none', async () => {
			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'actionButton', actionId: 'action-id', triggerId: 'trigger-id', payload: { context: 'roomAction' } },
				},
				res,
			);

			expect(convertRoomById.called).to.equal(false);
			expect(convertMessageById.called).to.equal(false);
			expect(triggerEvent.firstCall.args[1].payload).to.deep.equal({ context: 'roomAction' });
		});

		it('responds 500 with the error message when the event handler throws', async () => {
			triggerEvent.rejects(new Error('handler failed'));

			await api.routeHandler(
				{
					params: { id: 'app-id' },
					user: reqUser,
					body: { type: 'actionButton', actionId: 'action-id', triggerId: 'trigger-id', payload: { context: 'roomAction' } },
				},
				res,
			);

			expect(res.status.calledOnceWithExactly(500)).to.equal(true);
			expect(res.send.calledOnceWithExactly({ error: 'handler failed' })).to.equal(true);
		});
	});

	it('responds 400 for an unknown interaction type without triggering an event', async () => {
		await api.routeHandler({ params: { id: 'app-id' }, user: reqUser, body: { type: 'unknown' } }, res);

		expect(triggerEvent.called).to.equal(false);
		expect(res.status.calledOnceWithExactly(400)).to.equal(true);
		expect(res.send.calledOnceWithExactly({ error: 'Unknown action' })).to.equal(true);
	});
});
