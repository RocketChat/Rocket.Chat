import { Icon, Menu, Box } from '@rocket.chat/fuselage';
import React, { useContext, Dispatch as ReactDispatch, Context } from 'react';
import { IActionInterface } from '../../contexts/BlogDetailContext/BlogDetailReducer';

import { useRoute } from '../../contexts/RouterContext';

const DetailPageHeader = ({
	title,
	route,
	context,
}: {
	title: string;
	route: string;
	context?: Context<{
		dispatch: ReactDispatch<IActionInterface>;
	}>;
}) => {
	const { dispatch } = useContext(context);
	const PreviousRoute = useRoute(route);

	const goToPreviousPage = () => {
		dispatch({ type: 'CLEAR_DETAILS' });
		PreviousRoute.push({});
	};
	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '5px 5px' }}>
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<Icon name='chevron-right' fontSize='32px' style={{ marginRight: '15px', cursor: 'pointer' }} onClick={() => goToPreviousPage()} />
				<h3>{title}</h3>
			</div>
			<Menu
				className='single-blog-menu'
				options={{
					delete: {
						action: function noRefCheck(): void {
							console.log('here');
						},
						label: (
							<Box alignItems='center' color='danger' display='flex'>
								<Icon mie='x4' name='trash' size='x16' />
								Delete
							</Box>
						),
					},
					update: {
						action: function noRefCheck(): void {
							console.log('here');
						},
						label: (
							<Box alignItems='center' display='flex'>
								Update
							</Box>
						),
					},
				}}
			/>
		</div>
	);
};

export default DetailPageHeader;
