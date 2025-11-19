import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';

import ABACUpsellModal from './ABACUpsellModal';

const meta = {
	component: ABACUpsellModal,
	parameters: {
		layout: 'centered',
	},
	args: {
		onClose: action('onClose'),
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withTranslations('en', 'core', {
					Attribute_based_access_control: 'Attribute-Based Access Control',
					Attribute_based_access_control_title: 'Automate complex access management across your entire organization',
					Attribute_based_access_control_description:
						'ABAC automates room access, granting or revoking access based on dynamic user attributes rather than fixed roles.',
				})
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof ABACUpsellModal>;

export default meta;

export const Default = {
	args: {
		onClose: action('onClose'),
		onConfirm: action('onConfirm'),
	},
};
