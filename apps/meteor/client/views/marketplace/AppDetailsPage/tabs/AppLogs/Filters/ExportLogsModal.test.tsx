import { afterEach, describe, it, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

import * as stories from './ExportLogsModal.stories';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);
const onConfirm = fn<FunctionLike>();
const { Default } = composeStories(stories);

describe('ExportLogsModal', () => {
	afterEach(() => {
		mocker.clearAllMocks();
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`renders without crashing`, async (t) => {
			const view = render(<Story />, {
				wrapper: mockAppRoot().build(),
			});
			t.assert.snapshot(view.baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`Should have no a11y violations`, async () => {
			const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

			const results = await axe(container);

			expect(results).toHaveNoViolations();
		});
	});

	it('should send the correct payload to the endpoint', async () => {
		render(<Default onConfirm={onConfirm} />, {
			wrapper: mockAppRoot().build(),
		});

		expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Download' }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledWith('/api/apps/undefined/export-logs?count=2000&type=json');
	});

	it('should include instance filter in the payload to endpoint', async () => {
		render(
			<Default
				onConfirm={onConfirm}
				filterValues={{
					instance: '123',
				}}
			/>,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Download' }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledWith('/api/apps/undefined/export-logs?instanceId=123&count=2000&type=json');
	});
});
