import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';

import React from 'react';

type Props = {
	blogId: string;
	commentId: string;
	content: string;
};

const Comment = ({ blogId, commentId, content }: Props) => {
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
									console.log('Deleted comment');
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
							Meteor.call('updateComment', commentId, { content, blogId, parentId: blogId }, (error, result) => {
								if (result) {
									console.log('Updated comment');
								}
							});
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
