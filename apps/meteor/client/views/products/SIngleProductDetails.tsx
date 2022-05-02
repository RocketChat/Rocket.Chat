import { Button, Margins, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement, useContext } from 'react';

import DetailPageHeader from '../../components/DetailPageHeader/DetailPageHeader';
import { DispatchProductGlobalContext, ProductGlobalContext } from '../../contexts/ProductDetailContext/GlobalState';

const SingleProductDetails = (): ReactElement => {
	const { value } = useContext(ProductGlobalContext);
	const { title, description } = value;
	console.log(value, 'value');
	return (
		<>
			<DetailPageHeader title={title} route='products' context={DispatchProductGlobalContext} />
			<Margins block='15px'>
				<Modal>
					<Modal.Content>
						<h4>Description</h4>
						<p>{description}</p>
					</Modal.Content>
					<Modal.Footer>
						<Button>Play</Button>
					</Modal.Footer>
				</Modal>
			</Margins>
		</>
	);
};

export default SingleProductDetails;
