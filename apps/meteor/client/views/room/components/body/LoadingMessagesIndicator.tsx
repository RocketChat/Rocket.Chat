import type { ReactElement } from 'react';
import React from 'react';

const LoadingMessagesIndicator = (): ReactElement => (
	<div className='loading-animation'>
		<div className='bounce bounce1' />
		<div className='bounce bounce2' />
		<div className='bounce bounce3' />
	</div>
);

export default LoadingMessagesIndicator;
