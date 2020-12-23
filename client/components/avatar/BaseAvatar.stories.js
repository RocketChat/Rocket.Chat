import React from 'react';

import BaseAvatar from './BaseAvatar';

export default {
	title: 'components/avatar/BaseAvatar',
	component: BaseAvatar,
	argTypes: {
		size: { control: 'text' },
		url: { control: 'text' },
	},
};

const Template = (args) => <BaseAvatar {...args} />;

export const _BaseAvatar = Template.bind();
_BaseAvatar.storyName = 'BaseAvatar';
_BaseAvatar.args = {
	size: 'x48',
	url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==',
};
