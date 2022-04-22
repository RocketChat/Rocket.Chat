import { Box, Icon, Margins, Modal } from '@rocket.chat/fuselage';

import React, { ReactElement } from 'react';

type Props = {
	author: string;
	location: string;
	content: string;
	images: string;
	createdAt: string;
};

const SingleBlogPost = ({ author, location, content, images, createdAt }: Props): ReactElement => (
	<Margins block='15px'>
		<Modal>
			<Modal.Content>
				<Box display='flex' justifyContent='space-between' alignItems='center' style={{ marginTop: '10px' }}>
					<div>
						<Icon name='avatar' style={{ marginRight: '5px', fontSize: '40px' }} />
						<span>
							<a>{author}</a> in{' '}
							<a>
								<strong>{location}</strong>
							</a>
						</span>
					</div>
					<span>{createdAt}</span>
				</Box>
				<p>{content}</p>
				<div style={{ margin: '10px 0' }}>
					<img style={{ height: '300px', width: '100%' }} src={images} alt='blog image' />
				</div>
			</Modal.Content>
			<Modal.Footer>
				<Icon name='reply' fontSize='32px' style={{ marginRight: '5px', cursor: 'pointer' }} />
				<Icon name='star' fontSize='35px' style={{ marginRight: '5px', cursor: 'pointer' }} />
				<Icon name='send' fontSize='37px' style={{ marginRight: '5px', cursor: 'pointer' }} />
			</Modal.Footer>
		</Modal>
	</Margins>
);

export default SingleBlogPost;
