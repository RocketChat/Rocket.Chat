import { InputBox, Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useContext, useState } from 'react';

import BottomBar from '../../components/BottomBar';
import DetailPageHeader from '../../components/DetailPageHeader/DetailPageHeader';
import Page from '../../components/Page';
import { DispatchBlogGlobalContext, BlogGlobalContext } from '../../contexts/BlogDetailContext/GlobalState';
import Comment from './components/Comment';

const BlogView = (): ReactElement => {
	const { dispatch } = useContext(DispatchBlogGlobalContext);
	const { value } = useContext(BlogGlobalContext);
	const { id, author, createdAt, title, content, image, comments } = value;
	const [comment, setComment] = useState('');
	const [commentId, setCommentId] = useState('');
	console.log(value, 'value');

	const handleSubmit = (): void => {
		// When we are updating the commentId is usually set otherwise it'll be an empty string.
		if (!commentId.length) {
			Meteor.call('addComment', { content: comment, blogId: id, parentId: id }, (error, result) => {
				if (result) {
					setComment('');
					dispatch({ type: 'ADD_COMMENT', payload: result });
				}
			});
		} else {
			Meteor.call('updateComment', commentId, { content: comment, blogId: id, parentId: id }, (error, result) => {
				if (result) {
					setComment('');
					setCommentId('');
					console.log('Updated comment');
					dispatch({ type: 'UPDATE_COMMENT', payload: result });
				}
			});
		}
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<DetailPageHeader title={title} route='blogs' context={DispatchBlogGlobalContext} />

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
								<Comment
									key={index}
									blogId={comment.blogId}
									commentId={comment._id}
									content={comment.content}
									setComment={setComment}
									setCommentId={setCommentId}
								/>
							))}
					</div>
				</Page.Content>
				<BottomBar />
			</Page>
		</Page>
	);
};

export default BlogView;
