import { Box, Icon, Menu, InputBox, Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useContext, useState } from 'react';

import Comment from './components/Comment';
import Page from '../../components/Page';
import { useRoute } from '../../contexts/RouterContext';
import { DispatchGlobalContext, GlobalContext } from '../../contexts/BlogDetailContext/GlobalState';
import BottomBar from '../../components/BottomBar';

const BlogView = (): ReactElement => {
	const { value } = useContext(GlobalContext);
	const { id, author, createdAt, title, content, image, comments } = value;
	const [comment, setComment] = useState('');

	const { dispatch } = useContext(DispatchGlobalContext);
	const BlogsRoute = useRoute('blogs');

	const handleSubmit = (): void => {
		if (comment.length) {
			Meteor.call('addComment', { content: comment, blogId: id, parentId: id }, (error, result) => {
				if (result) {
					setComment('');
					console.log('Comment added successfully');
				}
			});
		}
	};

	const goToPreviousPage = () => {
		dispatch({ type: 'CLEAR_DETAILS' });
		BlogsRoute.push({});
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '5px 5px' }}>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<Icon
							name='chevron-right'
							fontSize='32px'
							style={{ marginRight: '15px', cursor: 'pointer' }}
							onClick={() => goToPreviousPage()}
						/>
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
				<Page.Content>
					<div style={{ margin: '10px 0' }}>
						<img style={{ height: '300px', width: '100%' }} src={image} alt='blog image' />
					</div>
					<div>
						{createdAt}. Posted by {author}
					</div>
					<div>{content}</div>
					<div style={{ margin: '15px 0' }}>
						<h4>Add a New Comment</h4>
						<InputBox
							type='text'
							placeholder='New Comment...'
							width='full'
							value={comment}
							onChange={(e: any): void => setComment(e.target.value)}
						/>
						<Button primary style={{ float: 'right', marginTop: '5px' }} onClick={handleSubmit}>
							Post
						</Button>
					</div>
					<div>
						<h4>Previous comments</h4>
						{comments.length &&
							comments.map((comment, index) => (
								<Comment key={index} blogId={comment.blogId} commentId={comment._id} content={comment.content} clearComment={setComment} />
							))}
					</div>
				</Page.Content>
				<BottomBar />
			</Page>
		</Page>
	);
};

export default BlogView;
