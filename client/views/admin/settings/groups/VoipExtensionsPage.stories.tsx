import { Story } from '@storybook/react';
import React, { ReactElement, ReactNode } from 'react';

import VoipExtensionsPage from './VoipExtensionsPage';

export default {
	title: 'components/VoipExtensionsPage',
	component: VoipExtensionsPage,
	decorators: [(fn: () => ReactNode): ReactElement => <div children={fn()} style={{ height: '100vh' }} />],
};

const data = {
	extensions: [
		{
			extension: '80000',
			state: 'unregistered',
			password: '',
			authtype: '',
		},
		{
			extension: '80000',
			state: 'unregistered',
			password: '',
			authtype: '',
		},
	],
};

export const _default: Story = () => (
	<VoipExtensionsPage
		data={data}
		phase=''
		reload={() => {
			'la';
		}}
	/>
);
