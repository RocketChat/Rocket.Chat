import { Modal, TextInput, TextAreaInput, Label, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useState, useEffect } from 'react';

type Props = {
	showModal: boolean;
	setShowModal: Function;
};

const CreateBlogForm = ({ showModal, setShowModal }: Props): ReactElement => {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [tags, setTags] = useState('');
	const [titleError, setTitleError] = useState(false);
	const [contentError, setTContentError] = useState(false);
	const handleSubmit = () => {
		const cleanedTags = tags.replace(/[, ]+/g, ',').trim();
		if (title.length && content.length) {
			const result = Meteor.call('createBlog', { title, content, tags: [cleanedTags] });
			console.log(result, 'result');
		}

		if (!title.length) {
			setTitleError(true);
		}

		if (!content.length) {
			setTContentError(true);
		}
	};
	return (
		<Modal display={showModal ? 'block' : 'none'}>
			<Modal.Header>
				<Modal.Title>Create New Blog</Modal.Title>
				<Modal.Close onClick={() => setShowModal(false)} />
			</Modal.Header>
			<Modal.Content>
				<Label required>Title</Label>
				<TextInput
					value={title}
					error={titleError ? 'error' : ''}
					onChange={(e: any) => setTitle(e.target.value)}
					placeholder='Add your title...'
					width='full'
					style={{ marginBottom: '8px' }}
				/>
				<Label required>Content</Label>
				<TextAreaInput
					value={content}
					error={contentError ? 'error' : ''}
					onChange={(e: any) => setContent(e.target.value)}
					placeholder='Add your content...'
					width='full'
					style={{ marginBottom: '8px' }}
				/>
				<Label>Tags eg. Technology, Blockchain</Label>
				<TextInput value={tags} onChange={(e: any) => setTags(e.target.value)} placeholder='Add your tags...' width='full' />
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={() => setShowModal(false)}>Cancel</Button>
					<Button primary onClick={handleSubmit}>
						Submit
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateBlogForm;
