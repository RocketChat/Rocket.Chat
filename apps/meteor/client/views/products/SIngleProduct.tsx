import { Icon, Margins, Box, Flex } from '@rocket.chat/fuselage';
import React, { ReactElement, useContext } from 'react';

import { DispatchProductGlobalContext } from '../../contexts/ProductDetailContext/GlobalState';
import { IGame } from '../../../definition/IGame';
import { useRoute } from '../../contexts/RouterContext';

const SingleProduct = ({ _id, title, description }: Partial<IGame>): ReactElement => {
	const { dispatch } = useContext(DispatchProductGlobalContext);
	const ProductDetailRoute = useRoute('products-detail');

	const handleDetailRoute = (): void => {
		const payload = {
			id: _id,
			title,
			description,
		};
		dispatch({ type: 'ADD_DETAILS', payload });
		ProductDetailRoute.push({ id: _id });
	};
	return (
		<Margins block='15px'>
			<Box display='flex' alignItems='center' justifyContent='space-between' style={{ cursor: 'pointer' }} onClick={handleDetailRoute}>
				<Flex.Item>{title}</Flex.Item>
				<Flex.Item>
					<Icon name='chevron-left' size='x20' />
				</Flex.Item>
			</Box>
		</Margins>
	);
};

export default SingleProduct;
