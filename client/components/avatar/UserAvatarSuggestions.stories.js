import { action } from '@storybook/addon-actions';
import React from 'react';

import UserAvatarSuggestions from './UserAvatarSuggestions';

export default {
	title: 'components/avatar/UserAvatarSuggestions',
	component: UserAvatarSuggestions,
	argTypes: {
		suggestions: { control: 'object' },
		disabled: { control: 'boolean' },
	},
};

const Template = (args) => <UserAvatarSuggestions
	{...args}
	setAvatarObj={action('setAvatarObj')}
	setNewAvatarSource={action('setNewAvatarSource')}
/>;

export const _UserAvatarSuggestions = Template.bind();
_UserAvatarSuggestions.storyName = 'UserAvatarSuggestions';
_UserAvatarSuggestions.args = {
	suggestions: [],
};
