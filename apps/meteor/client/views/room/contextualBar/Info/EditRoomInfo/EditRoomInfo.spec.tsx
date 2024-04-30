import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { createFakeRoom } from '../../../../../../tests/mocks/data';
import EditRoomInfo from './EditRoomInfo';

const wrapper = mockAppRoot()
	.withSetting('RetentionPolicy_MaxAge_Channels', '30')
	.withSetting('RetentionPolicy_MaxAge_Groups', '15')
	.withSetting('RetentionPolicy_Enabled', 'true')
	.withTranslations('en', 'core', {
		RetentionPolicyRoom_MaxAge: 'Max age {{max}}',
		Prune: 'Prune',
	})
	.build();

const fakeChannel = createFakeRoom({
	t: 'c',
	retention: {
		enabled: true,
		overrideGlobal: true,
	},
} as any) as IRoomWithRetentionPolicy;

const fakeGroup = createFakeRoom({
	t: 'p',
	retention: {
		enabled: true,
		overrideGlobal: true,
	},
} as any) as IRoomWithRetentionPolicy;

describe('EditRoomInfo', () => {
	// TODO: test the rest of the component
	describe('Override retention policy', () => {
		it('should show the correct default value for public rooms', async () => {
			render(<EditRoomInfo room={fakeChannel} onClickClose={() => null} onClickBack={() => null} />, { wrapper });

			userEvent.click(screen.getByText('Prune'));
			expect(screen.getByText('Max age 30'));
		});

		it('should show the correct default value for private rooms', async () => {
			render(<EditRoomInfo room={fakeGroup} onClickClose={() => null} onClickBack={() => null} />, { wrapper });

			userEvent.click(screen.getByText('Prune'));
			expect(screen.getByText('Max age 15'));
		});

		it('should update the counter to a value bigger than 1', async () => {
			render(<EditRoomInfo room={fakeGroup} onClickClose={() => null} onClickBack={() => null} />, { wrapper });

			userEvent.click(screen.getByText('Prune'));
			const maxAgeInput: HTMLInputElement = screen.getByRole('input', { name: 'retentionMaxAge' });
			userEvent.type(maxAgeInput, '0');
			expect(maxAgeInput.value).toBe('1');
			userEvent.type(maxAgeInput, '50');
			expect(maxAgeInput.value).toBe('50');
		});
	});
});
