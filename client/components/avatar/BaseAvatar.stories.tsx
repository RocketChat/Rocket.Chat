import { Story } from '@storybook/react';
import React from 'react';

import BaseAvatar from './BaseAvatar';

export default {
	title: 'components/Avatar/BaseAvatar',
	component: BaseAvatar,
};

export const Default = (): Story => <BaseAvatar url='https://via.placeholder.com/256' />;
