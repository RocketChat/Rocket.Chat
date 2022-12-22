import type { FC } from 'react';
import React from 'react';

const PageLoading: FC = () => (
	<div className='page-loading'>
		<div className='loading-animation'>
			<div className='bounce bounce1'></div>
			<div className='bounce bounce2'></div>
			<div className='bounce bounce3'></div>
		</div>
	</div>
);

export default PageLoading;
