import { Box, Icon, Margins, Modal, Menu } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type Props = {
	content?: string;
	createdAt?: string;
	_id?: string;
	title?: string;
	tags?: string[];
	setModalShow: Function;
	setBlogId?: Function;
	setUpdateTitle?: Function;
	setUpdateContent?: Function;
	setUpdateTags?: Function;
};

const SingleBlogPost = ({
	_id,
	title,
	tags,
	setModalShow,
	content = 'dummy content',
	createdAt = '2022-04-18',
	setBlogId,
	setUpdateTitle,
	setUpdateContent,
	setUpdateTags,
}: Props): ReactElement => {
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
					<Box display='flex' justifyContent='flex-end' alignItems='center' flexDirection='column' style={{ margin: '13px 0px' }}>
						<Menu
							className='single-blog-menu'
							style={{ marginLeft: 'auto' }}
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
									action: function noRefCheck(): void {
										setModalShow(true);
										setBlogId(_id);
										setUpdateTitle(title);
										setUpdateContent(content);
										setUpdateTags(tags);
									},
									label: (
										<Box alignItems='center' display='flex'>
											Update
										</Box>
									),
								},
							}}
						/>
						<Box display='flex' justifyContent='space-between' alignItems='center' width='full'>
							<div>
								<Icon name='avatar' style={{ marginRight: '5px', fontSize: '40px' }} />
								<span>
									<a>{authors[randNum]}</a>
								</span>
							</div>
							<span>{createdAt.toString().slice(4, 10)}</span>
						</Box>
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
