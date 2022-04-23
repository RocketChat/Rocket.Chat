import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import { useRoute } from '../../contexts/RouterContext';

const ProductSection = (props: typeof Box): ReactElement => {
	const { sidebar } = useLayout();
	const ProductsRoute = useRoute('products');

	const handleRoute = useMutableCallback(() => {
		sidebar.toggle();
		ProductsRoute.push({});
	});

	// The className is a paliative while we make TopBar.ToolBox optional on fuselage
	return (
		<div onClick={handleRoute} style={{ cursor: 'pointer' }}>
			<Sidebar.TopBar.ToolBox className='omnichannel-sidebar' {...props}>
				<Sidebar.TopBar.Title>Products</Sidebar.TopBar.Title>
				<Sidebar.TopBar.Action icon='chevron-left' />
			</Sidebar.TopBar.ToolBox>
		</div>
	);
};

export default ProductSection;
