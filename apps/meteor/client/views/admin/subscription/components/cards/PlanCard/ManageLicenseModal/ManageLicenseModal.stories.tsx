import type { BehaviorWithContext } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { screen, userEvent, expect } from 'storybook/test';

import ManageLicenseModal from './ManageLicenseModal';

const SAMPLE_LICENSE = 'RCLICENSE-'.padEnd(120, 'x');

const validationSuccess = () => null;
const validationFailure = (reasons: BehaviorWithContext[]) => () => Promise.reject({ reasons });

const enterLicense = async (text: string) => {
	await userEvent.click(screen.getByRole('textbox'));
	await userEvent.paste(text);
};

export default {
	component: ManageLicenseModal,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onCancel: action('onCancel'),
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().withEndpoint('POST', '/v1/licenses.validate', validationSuccess).build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof ManageLicenseModal>;

type Story = StoryObj<typeof ManageLicenseModal>;

export const Default: Story = {
	args: {
		enterpriseLicense: '',
	},
};

export const WithCurrentLicense: Story = {
	args: {
		enterpriseLicense: SAMPLE_LICENSE,
	},
};

export const InvalidLicense: Story = {
	args: {
		enterpriseLicense: '',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withEndpoint('POST', '/v1/licenses.validate', validationFailure([{ behavior: 'invalidate_license', reason: 'period' }]))
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	play: async () => {
		await enterLicense(SAMPLE_LICENSE);
		await expect(await screen.findByText('Invalid_license')).toBeInTheDocument();
	},
};
