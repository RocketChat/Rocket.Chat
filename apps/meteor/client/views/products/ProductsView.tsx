import { Grid } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useState } from 'react';
import { IProduct } from '../../../definition/IProduct';

import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import PageInlineNavbar from '../../components/PageInlineNavbar/PageInlineNavbar';
import TopBar from '../../topbar/TopBar';
import SingleProduct from './SIngleProduct';

const ProductsView = (): ReactElement => {
	const [productResults, setProductResults] = useState([]);
	const data: IProduct[] = [
		{
			_id: 'firstproduct',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Laptop',
			description: 'Portable computer',
			ranking: 5,
			price: 5000,
		},
		{
			_id: 'secondProduct',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Mobile Phone',
			description: 'Portable Cellphone',
			ranking: 8,
			price: 2000,
		},
		{
			_id: 'thirdProduct',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Tablet',
			description: 'Cellphone laptop hybrid',
			ranking: 2,
			price: 3000,
		},
	];

	const getBackendProducts = () => {
		Meteor.call('getProducts', { count: 10 }, {}, (error, result) => {
			if (result) {
				if (result.records.length) {
					setProductResults(result.records);
					console.log('Products were fetched');
				} else {
					data.map((product, index) => {
						// The server requires us to wait atleast 2 seconds before sending in a new request.
						if (index > 0) {
							setTimeout(() => {
								Meteor.call(
									'createProduct',
									{ title: product.title, description: product.description, ranking: product.ranking, price: product.price },
									(error, result) => {
										if (result) {
											console.log('Games were created');
										}
									},
								);
							}, 5000);
						}

						// Refetch the games once its done adding.
						if (index === data.length - 1) {
							getBackendProducts();
						}
					});
				}
			}
		});
	};
	useEffect(() => {
		if (!productResults.length) {
			getBackendProducts();
		}
	}, []);
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<PageInlineNavbar />
				<Page.Content>
					<Grid style={{ overflowY: 'auto', overflowX: 'hidden' }}>
						{productResults.map((item, index) => (
							<Grid.Item xs={4} md={4} lg={6} key={index}>
								<SingleProduct {...item} />
							</Grid.Item>
						))}
					</Grid>
				</Page.Content>
				<BottomBar />
			</Page>
		</Page>
	);
};

export default ProductsView;
