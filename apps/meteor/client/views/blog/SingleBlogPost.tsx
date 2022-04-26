import { Box, Icon, Margins, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type Props = {
	location?: string;
	content?: string;
	createdAt?: string;
};

const SingleBlogPost = ({ location = 'Kenya', content = 'dummy content', createdAt = '2022-04-18' }: Props): ReactElement => {
	const authors = ['Tanjiro Kamado', 'Zenitsu Agatsuma', 'Hashibira Inosuke', 'Nezuko Kamado', 'Tanjiro Kamado'];
	const images = [
		'images/blog_images/Kimetsu_no_yaiba_1.jpg',
		'images/blog_images/Kimetsu_no_yaiba_2.jpg',
		'images/blog_images/Kimetsu_no_yaiba_3.png',
		'images/blog_images/Kimetsu_no_yaiba_4.jpg',
		'images/blog_images/Kimetsu_no_yaiba_5.png',
	];

	// Use the random number to display random images and names.
	const randNum = Math.floor(Math.random() * 5);

	return (
		<Margins block='15px'>
			<Modal>
				<Modal.Content>
					<Box display='flex' justifyContent='space-between' alignItems='center' style={{ marginTop: '10px' }}>
						<div>
							<Icon name='avatar' style={{ marginRight: '5px', fontSize: '40px' }} />
							<span>
								<a>{authors[randNum]}</a> in{' '}
								<a>
									<strong>{location}</strong>
								</a>
							</span>
						</div>
						<span>{createdAt.toString().slice(0, 15)}</span>
					</Box>
					<p>{content}</p>
					<div style={{ margin: '10px 0' }}>
						<img style={{ height: '300px', width: '100%' }} src={images[randNum]} alt='blog image' />
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
};

export default SingleBlogPost;
