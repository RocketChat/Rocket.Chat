import React from 'react';

import { DescriptionList } from './DescriptionList';
import Page from '../../components/basic/Page';

export default {
	title: 'admin/info/DescriptionList',
	component: DescriptionList,
	decorators: [
		(fn) => <div className='rc-old'>{fn()}</div>,
		(fn) => <Page>
			<Page.Content>
				{fn()}
			</Page.Content>
		</Page>,
	],
};

export const _default = () => <DescriptionList>
	<DescriptionList.Entry label='Key'>Value</DescriptionList.Entry>
</DescriptionList>;
