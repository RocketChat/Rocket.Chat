import { Story } from '@storybook/react';
import React from 'react';

import CallControls from './CallControls';
import OmnichannelCallComponent from './OmnichannelCallComponent';

export default {
	title: 'components/OmnichannelCallComponent',
	component: OmnichannelCallComponent,
};

export const FullCallComponent: Story = () => (
	<div style={{ width: '336px', backgroundColor: '#2f343d' }}>
		<OmnichannelCallComponent state='Current' data='' callData={{ state: 'current' }} />
	</div>
);

export const ButtonGroup: Story = () => <CallControls room={{ state: 'current' }} />;
