import React from 'react';

import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export default {
	title: 'admin/info/InformationList',
	component: InformationList,
	decorators: [
		(fn) => <section className='page-container page-list'>
			<div className='content'>
				{fn()}
			</div>
		</section>,
	],
};

export const _default = () => <InformationList>
	<InformationEntry label='Key'>Value</InformationEntry>
</InformationList>;
