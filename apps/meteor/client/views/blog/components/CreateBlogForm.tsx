import { Modal, TextInput, TextAreaInput, Label, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useState, useEffect } from 'react';

type Props = {
	showModal: boolean;
	setShowModal: Function;
	blogId: string;
	updateTitle?: string;
	updateContent?: string;
	updateTags?: string[];
	clearUpdateFields?: Function;
};

const CreateBlogForm = ({
	showModal,
	setShowModal,
	blogId,
	updateTitle,
	updateContent,
	updateTags,
	clearUpdateFields,
}: Props): ReactElement => {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [tags, setTags] = useState('');
	const [titleError, setTitleError] = useState(false);
	const [contentError, setTContentError] = useState(false);

	useEffect(() => {
		if (blogId.length) {
			setTitle(updateTitle);
			setContent(updateContent);
			// Since the tag field is optional, sometimes it will be empty
			// hence we have to check it first
			if (updateTags) {
				setTags(updateTags.join(', '));
			}
		}
	}, [blogId, updateContent, updateTags, updateTitle]);

	const clearFields = (): void => {
		setTitle('');
		setContent('');
		setTags('');
	};

	const createBlog = (method: string, cleanedTags: string): void => {
		Meteor.call(method, { title, content, tags: [cleanedTags] }, (error, result) => {
			// TODO: Add a success and error messages
			if (result) {
				clearFields();
				setShowModal(false);
				console.log(result, 'Created blog');
			}
		});
	};

	const updateBlog = (method: string, cleanedTags: string): void => {
		Meteor.call(method, blogId, { title, content, tags: [cleanedTags] }, (error, result) => {
			// TODO: Add a success and error messages
			if (result) {
				clearFields();
				clearUpdateFields();
				setShowModal(false);
				console.log(result, 'Updated blog');
			}
		});
	};

	const handleSubmit = (): void => {
		const cleanedTags = tags.replace(/[, ]+/g, ',').trim();
		if (title.length && content.length) {
			// When it's an update then use the updateBlog method.
			if (blogId.length) {
				updateBlog('updateBlog', cleanedTags);
			} else {
				createBlog('createBlog', cleanedTags);
			}
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

				<Modal.Close onClick={(): void => setShowModal(false)} />
			</Modal.Header>
			<Modal.Content>
				<Label required>Title</Label>
				<TextInput
					value={title}
					error={titleError ? 'error' : ''}
					onChange={(e: any): void => setTitle(e.target.value)}
					placeholder='Add your title...'
					width='full'
					style={{ marginBottom: '8px' }}
				/>
				<Label required>Content</Label>
				<TextAreaInput
					value={content}
					error={contentError ? 'error' : ''}
					onChange={(e: any): void => setContent(e.target.value)}
					placeholder='Add your content...'
					width='full'
					style={{ marginBottom: '8px' }}
				/>
				<Label>Tags eg. Technology, Blockchain</Label>

				<TextInput value={tags} onChange={(e: any): void => setTags(e.target.value)} placeholder='Add your tags...' width='full' />
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={(): void => setShowModal(false)}>Cancel</Button>

					<Button primary onClick={handleSubmit}>
						Submit
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateBlogForm;
