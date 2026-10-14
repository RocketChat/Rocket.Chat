import { beforeEach, describe, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../../../client/lib/getURL', {
	exports: {
		getURL: (url: string) => url,
	},
});
mock.module('./ParentRoom', {
	exports: {
		default: {
			__esModule: true,
			default: fn<FunctionLike>(() => <div>ParentRoom</div>),
		},
	},
});
mock.module('./RoomToolbox', {
	exports: {
		default: {
			__esModule: true,
			default: fn<FunctionLike>(() => <div>RoomToolbox</div>),
		},
	},
});
const stories: typeof import('./RoomInviteHeader.stories') = require('./RoomInviteHeader.stories');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const appRoot = mockAppRoot().build();

describe('RoomInviteHeader', () => {
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const view = render(<Story />, { wrapper: appRoot });
			t.assert.snapshot(view.baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`${_storyname} should have no a11y violations`, async () => {
			const { container } = render(<Story />, { wrapper: appRoot });

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});
});
