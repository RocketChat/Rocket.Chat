import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';

import UserAvatarChip from './UserAvatarChip';

const meta = {
	component: UserAvatarChip,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof UserAvatarChip>;

export default meta;

export const Default = {
	args: {
		onClick: action('onClick'),
		name: 'John Doe',
		username: 'johndoe',
	},
};

export const Federated = {
	args: {
		onClick: action('onClick'),
		name: 'John Doe',
		username: 'johndoe',
		federated: true,
	},
};

export const WithoutName = {
	args: {
		onClick: action('onClick'),
		username: 'johndoe',
	},
};

export const WithoutClickEvent = {
	args: {
		username: 'johndoe',
	},
};
