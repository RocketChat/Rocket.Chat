import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useContext } from 'react';

import { DispatchBlogGlobalContext } from '../../../contexts/BlogDetailContext/GlobalState';

type Props = {
	blogId: string;
	commentId: string;
	content: string;
	setComment: Function;
	setCommentId: Function;
};

const Comment = ({ commentId, content, setComment, setCommentId }: Props): ReactElement => {
	const { dispatch } = useContext(DispatchBlogGlobalContext);

	return (
		<Box display='flex' justifyContent='space-between' alignItems='center'>
			<div style={{ marginLeft: '20px' }}>{content}</div>
			<Menu
				className='single-blog-menu'
				options={{
					delete: {
						action: function noRefCheck(): void {
							Meteor.call('deleteComment', commentId, (error, result) => {
								if (result) {
									console.log('Deleted comment', result);
									dispatch({ type: 'DELETE_COMMENT', payload: { commentId } });
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
							setComment(content);
							setCommentId(commentId);
						},
						label: (
							<Box alignItems='center' display='flex'>
								Update
							</Box>
						),
					},
				}}
			/>
		</Box>
	);
};

export default Comment;
