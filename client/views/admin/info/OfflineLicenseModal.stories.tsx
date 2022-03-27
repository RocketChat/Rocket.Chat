import { ComponentMeta, ComponentStory } from '@storybook/react';
import { screen, userEvent } from '@storybook/testing-library';
import React from 'react';

import OfflineLicenseModal from './OfflineLicenseModal';

export default {
	title: 'Admin/Info/OfflineLicenseModal',
	component: OfflineLicenseModal,
	parameters: {
		layout: 'fullscreen',
		serverContext: {
			callEndpoint: {
				'POST /v1/licenses.add': async ({ license }: { license: string }) => ({
					success: license === 'valid-license',
				}),
			},
		},
	},
	argTypes: {
		onClose: { action: 'onClose' },
	},
} as ComponentMeta<typeof OfflineLicenseModal>;

const Template: ComponentStory<typeof OfflineLicenseModal> = (args) => <OfflineLicenseModal {...args} />;

export const WithValidLicense = Template.bind({});
WithValidLicense.args = {
	license: 'valid-license',
	licenseStatus: 'valid',
};

export const WithInvalidLicense = Template.bind({});
WithInvalidLicense.args = {
	license: 'invalid-license',
	licenseStatus: 'invalid',
};

export const ApplyingValidLicense = Template.bind({});
ApplyingValidLicense.play = async () => {
	const licenseInput = screen.getByRole('textbox');

	await userEvent.type(licenseInput, 'valid-license', { delay: 100 });

	const applyButton = screen.getByRole('button', { name: 'Apply license' });

	userEvent.click(applyButton);
};

export const ApplyingInvalidLicense = Template.bind({});
ApplyingInvalidLicense.play = async () => {
	const licenseInput = screen.getByRole('textbox');

	await userEvent.type(licenseInput, 'invalid-license', { delay: 100 });

	const applyButton = screen.getByRole('button', { name: 'Apply license' });

	userEvent.click(applyButton);
};
