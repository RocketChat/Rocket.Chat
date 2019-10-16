import React from 'react';

import { DescriptionList } from './DescriptionList';

export default {
	title: 'admin/info/DescriptionList',
	component: DescriptionList,
	decorators: [
		(fn) => <section className='page-container page-list'>
			<div className='content'>
				{fn()}
			</div>
		</section>,
	],
};

export const _default = () => <DescriptionList>
	<DescriptionList.Entry label='Key'>Value</DescriptionList.Entry>
</DescriptionList>;
