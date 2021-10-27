import { Story } from '@storybook/react';
import React, { useState } from 'react';

import CallComponent from './CallComponent';
import CallControls from './CallControls';
import { PhoneNumberDisplay } from './PhoneNumberDisplay';
import PhoneNumberInput from './PhoneNumberInput';
import { useButtonsList } from './hooks/useButtonsLists';

const callData = {
	callerId: '+912312324349',
	callerName: 'Amol',
	host: 'vps-c2120808',
};
const data = {
	callsInQueue: 10,
	state: 'Current',
	buttonsList: useButtonsList,
};

export default {
	title: 'components/OmnichannelCallComponent',
	component: CallComponent,
};

export const FullCallComponent: Story = () => (
	<div style={{ width: '336px', backgroundColor: '#2f343d' }}>
		<CallComponent data={data} callData={callData} buttons={useButtonsList()} />
	</div>
);

export const ButtonGroup: Story = () => <CallControls state={'current'} />;

export const PhoneNumber: Story = () => {
	const [phoneNumber, setPhoneNumber] = useState('+912312324349');
	return (
		<>
			<PhoneNumberInput phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} />
			<div style={{ width: '336px', height: '276px', backgroundColor: '#2f343d' }}>
				<PhoneNumberDisplay phoneNumber={phoneNumber} />;
			</div>
		</>
	);
};
