import { Box, Icon, Menu, InputBox, Button } from '@rocket.chat/fuselage';
import React, { ReactElement, useContext } from 'react';

import { GlobalContext } from '../../contexts/BlogDetailContext/GlobalState';
import Page from '../../components/Page';

const BlogView = (): ReactElement => {
	const { value } = useContext(GlobalContext);
	const { id, author, createdAt, title, content, image } = value;

	return (
		<Page flexDirection='row'>
			<Page>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
					<div>
						<Icon name='chevron-right' fontSize='32px' style={{ marginRight: '15px', cursor: 'pointer' }} />
						<h3>{title}</h3>
					</div>
					<Menu
						className='single-blog-menu'
						options={{
							delete: {
								action: function noRefCheck(): void {},
								label: (
									<Box alignItems='center' color='danger' display='flex'>
										<Icon mie='x4' name='trash' size='x16' />
										Delete
									</Box>
								),
							},
							update: {
								action: function noRefCheck(): void {},
								label: (
									<Box alignItems='center' display='flex'>
										Update
									</Box>
								),
							},
						}}
					/>
				</div>
				<Page.Content>
					<div style={{ margin: '10px 0' }}>
						<img style={{ height: '300px', width: '100%' }} src={image} alt='blog image' />
					</div>
					<div>{content}</div>
					<div>
						<h4>Add a New Comment</h4>
						<InputBox type='text' placeholder='New Comment...' width='full' />
						<Button primary style={{ marginLeft: 'auto' }}>
							Post
						</Button>
					</div>
					<div>
						<h4>Previous comments</h4>
					</div>
				</Page.Content>
			</Page>
		</Page>
	);
};

export default BlogView;
