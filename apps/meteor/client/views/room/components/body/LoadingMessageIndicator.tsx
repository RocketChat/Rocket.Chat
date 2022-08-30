import React, { ReactElement } from 'react';

const LoadingMessageIndicator = (): ReactElement => (
	<div className='loading-animation'>
		<div className='bounce bounce1' />
		<div className='bounce bounce2' />
		<div className='bounce bounce3' />
	</div>
);

export default LoadingMessageIndicator;
