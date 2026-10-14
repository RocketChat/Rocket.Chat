import { after, before, beforeEach, describe, it } from 'node:test';

import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { fireGlobalEventBase } from './fireGlobalEventBase';

const postMessageMock = fn<FunctionLike>();
const dispatchEventMock = fn<FunctionLike>();

const originalDispatch = window.dispatchEvent;
const originalPostMessage = parent.postMessage;

describe('fireGlobalEventBase', () => {
	before(() => {
		window.dispatchEvent = dispatchEventMock;
		parent.postMessage = postMessageMock;
	});

	beforeEach(() => {
		postMessageMock.mockClear();
		dispatchEventMock.mockClear();
	});

	after(() => {
		window.dispatchEvent = originalDispatch;
		parent.postMessage = originalPostMessage;
	});

	it('should dispatch event but not post message', () => {
		const detail = 'test-detail';
		const postMessage = fireGlobalEventBase('test-event', detail);
		postMessage(false, '');

		expect(postMessageMock).not.toHaveBeenCalled();

		expect(dispatchEventMock).toHaveBeenCalledTimes(1);

		const result = dispatchEventMock.mock.lastCall?.[0];
		expect(result).toBeInstanceOf(CustomEvent);
		expect(result.detail).toBe(detail);
		expect(result.type).toBe('test-event');
	});

	it('should dispatch event and post message', () => {
		const detail = 'test-detail';
		const origin = 'test-origin';
		const postMessage = fireGlobalEventBase('test-event', detail);
		postMessage(true, origin);

		expect(postMessageMock).toHaveBeenCalledTimes(1);

		expect(dispatchEventMock).toHaveBeenCalledTimes(1);

		const dispatchResult = dispatchEventMock.mock.lastCall?.[0];
		expect(dispatchResult).toBeInstanceOf(CustomEvent);
		expect(dispatchResult.detail).toBe(detail);
		expect(dispatchResult.type).toBe('test-event');

		const [postEventResult, originResult] = postMessageMock.mock.lastCall ?? [];
		expect(postEventResult).toBeInstanceOf(Object);
		expect(originResult).toBe(origin);
		expect(postEventResult.data).toBe(detail);
		expect(postEventResult.eventName).toBe('test-event');
	});
});
