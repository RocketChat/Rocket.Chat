import { after, before, describe, it, mock } from 'node:test';

import { faker } from '@faker-js/faker';
import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Random } from '@rocket.chat/random';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let SystemMessage: (typeof import('./SystemMessage'))['default'];

const wrapper = mockAppRoot().withTranslations('en', 'core', {
	changed_room_description_to__room_description_: 'changed room description to: {{room_description}}',
});

const createBaseMessage = (msg: string): IMessage => ({
	_id: Random.id(),
	t: 'room_changed_description',
	rid: Random.id(),
	ts: new Date(),
	msg,
	u: {
		_id: Random.id(),
		username: faker.person.firstName().toLocaleLowerCase(),
		name: faker.person.fullName(),
	},
	groupable: false,
	_updatedAt: new Date(),
});

describe('SystemMessage', () => {
	before(() => {
		enterModuleScope();
		mock.module('../content/Attachments', {
			exports: {
				default: {
					default: () => <div>attachments</div>,
				},
			},
		});
		mock.module('../content/MessageActions', {
			exports: {
				default: {
					default: () => <div>message actions</div>,
				},
			},
		});
		mock.module(require.resolve('meteor/meteor'), {
			exports: {
				default: (() => {
					const actual = require('meteor/meteor');
					return {
						...actual,
						Meteor: {
							...actual.Meteor,
							startup: (callback: () => void) => callback(),
						},
					};
				})(),
			},
		});
		({ default: SystemMessage } = require('./SystemMessage'));
	});

	after(leaveModuleScope);
	it('should render system message', () => {
		const message = createBaseMessage('& test &');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
	});

	it('should not show escaped html while rendering system message', () => {
		const message = createBaseMessage('& test &');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
		expect(screen.queryByText('changed room description to: &amp; test &amp;')).not.toBeInTheDocument();
	});

	it('should not inject html', () => {
		const message = createBaseMessage('<button title="test-title">OK</button>');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.queryByTitle('test-title')).not.toBeInTheDocument();
		expect(screen.getByText('changed room description to: <button title="test-title">OK</button>')).toBeInTheDocument();
	});
});
