import { Story } from '@storybook/react';
import React, { useState, useEffect, useRef } from 'react';

import CallComponent from './CallComponent';
import CallControls from './CallControls';
import { PhoneNumberDisplay } from './PhoneNumberDisplay';
import PhoneNumberInput from './PhoneNumberInput';
import { useButtonsList } from './hooks/useButtonsLists';

const Spacer = (): any => <div style={{ height: '1rem' }} />;

const callData = {
	callerId: '+912312324349',
	callerName: 'Amol',
	host: 'vps-c2120808',
};

const dataIncoming = {
	callsInQueue: 10,
	state: 'incoming',
	buttonsList: useButtonsList,
};

const dataDisabled = {
	callsInQueue: 10,
	state: 'disabled',
	buttonsList: useButtonsList,
};

export default {
	title: 'components/OmnichannelCallComponent',
	component: CallComponent,
};

export const FullCallComponentCurrent: Story = () => {
	const start = useRef(Date.now());
	const [seconds, setSeconds] = useState(0);
	console.log(seconds);

	useEffect(() => {
		// Simulates the response that we will get from the server regarding call time
		setInterval(() => {
			const delta = Date.now() - start.current;
			setSeconds(delta);
		}, 1000);
	}, []);

	const dataCurrent = {
		callsInQueue: 10,
		state: 'current',
		buttonsList: useButtonsList,
		callTime: new Date(seconds).toISOString().slice(11, 19),
	};
	return (
		<>
			Current
			<div style={{ width: '336px', backgroundColor: '#2f343d' }}>
				<CallComponent
					data={dataCurrent}
					callData={callData}
					buttons={useButtonsList(dataCurrent.state)}
				/>
			</div>
			<Spacer />
			Incoming
			<div style={{ width: '336px', backgroundColor: '#2f343d' }}>
				<CallComponent
					data={dataIncoming}
					callData={callData}
					buttons={useButtonsList(dataIncoming.state)}
				/>
			</div>
			<Spacer />
			Disabled
			<div style={{ width: '336px', backgroundColor: '#2f343d' }}>
				<CallComponent
					data={dataDisabled}
					callData={callData}
					buttons={useButtonsList(dataDisabled.state)}
				/>
			</div>
		</>
	);
};

export const ButtonGroup: Story = () => <CallControls state={'incoming'} />;

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
