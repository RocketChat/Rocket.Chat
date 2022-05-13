import { Box, Icon, Margins, Modal, Menu } from '@rocket.chat/fuselage';
import { useRoute } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useContext } from 'react';

import { DispatchBlogGlobalContext } from '../../contexts/BlogDetailContext/GlobalState';

type Props = {
	content?: string;
	createdAt?: string;
	_id?: string;
	title?: string;
	tags?: string[];

	comments?: Record<string, any>[];
	setModalShow?: Function;

	setBlogId?: Function;
	setUpdateTitle?: Function;
	setUpdateContent?: Function;
	setUpdateTags?: Function;
	blogResults: Record<string, any>[];
	setBlogResults: Function;
};

const SingleBlogPost = ({
	_id,
	title,
	tags,
	setModalShow,
	content = 'dummy content',
	createdAt = '2022-04-18',

	comments,

	setBlogId,
	setUpdateTitle,
	setUpdateContent,
	setUpdateTags,
	blogResults,
	setBlogResults,
}: Props): ReactElement => {
	const { dispatch } = useContext(DispatchBlogGlobalContext);

	const authors = ['Tanjiro Kamado', 'Zenitsu Agatsuma', 'Hashibira Inosuke', 'Nezuko Kamado', 'Tanjiro Kamado'];
	const images = [
		'images/blog_images/Kimetsu_no_yaiba_1.jpg',
		'images/blog_images/Kimetsu_no_yaiba_2.jpg',
		'images/blog_images/Kimetsu_no_yaiba_3.png',
		'images/blog_images/Kimetsu_no_yaiba_4.jpg',
		'images/blog_images/Kimetsu_no_yaiba_5.png',
	];

	const BlogDetailRoute = useRoute('blog-detail');

	// Use the random number to display random images and names.
	const randNum = Math.floor(Math.random() * 5);

	const handleDetailRoute = (id: string, author: string, createdAt: string, title: string, content: string, image: string): void => {
		const payload = {
			id,
			author,
			createdAt,
			title,
			content,
			image,

			comments,
		};
		dispatch({ type: 'ADD_DETAILS', payload });
		BlogDetailRoute.push({ id });
	};

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
									action: function noRefCheck(): void {
										Meteor.call('deleteBlog', _id, (error, result) => {
											if (result) {
												// TODO: Add a success and error messages
												console.log('Deleted successfully');
												const removedBlog = blogResults.filter((item) => item._id !== result._id);
												setBlogResults(removedBlog);
											}
										});
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

					<div
						onClick={(): void =>
							handleDetailRoute(_id, authors[randNum], createdAt.toString().slice(4, 10), title, content, images[randNum])
						}
						style={{ cursor: 'pointer' }}
					>
						<p>{content}</p>
						<div style={{ margin: '10px 0' }}>
							<img style={{ height: '300px', width: '100%' }} src={images[randNum]} alt='blog image' />
						</div>
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
