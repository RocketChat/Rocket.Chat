import { action } from '@storybook/addon-actions';
import React from 'react';

import UserAvatarEditor from './UserAvatarEditor';

export default {
	title: 'components/avatar/UserAvatarEditor',
	component: UserAvatarEditor,
	argTypes: {
		username: { control: 'text' },
		suggestions: { control: 'object' },
		disabled: { control: 'boolean' },
		etag: { control: 'text' },
	},
};

const Template = (args) => <UserAvatarEditor {...args} setAvatarObj={action('setAvatarObj')} />;

export const _UserAvatarEditor = Template.bind();
_UserAvatarEditor.storyName = 'UserAvatarEditor';
_UserAvatarEditor.args = {
	username: 'rocket.cat',
};
