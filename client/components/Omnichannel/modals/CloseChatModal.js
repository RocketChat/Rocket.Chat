import { Field, Button, TextInput, Icon, ButtonGroup, Modal, Box } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useForm } from '../../../hooks/useForm';
import Tags from '../Tags';

const CloseChatModal = ({ department = {}, onCancel, onConfirm }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);

	const { values, handlers } = useForm({ comment: '', tags: [] });

	const { comment, tags } = values;
	const { handleComment, handleTags } = handlers;
	const [commentError, setCommentError] = useState('');
	const [tagError, setTagError] = useState('');
	const [tagRequired, setTagRequired] = useState(false);

	const handleConfirm = useCallback(() => {
		onConfirm(comment, tags);
	}, [comment, onConfirm, tags]);

	useComponentDidUpdate(() => {
		setCommentError(!comment ? t('The_field_is_required', t('Comment')) : '');
	}, [t, comment]);

	const canConfirm = useMemo(() => (!tagRequired ? !!comment : !!comment && tags.length > 0), [
		comment,
		tagRequired,
		tags,
	]);

	useEffect(() => {
		department?.requestTagBeforeClosingChat && setTagRequired(true);
		setTagError(
			tagRequired && (!tags || tags.length === 0)
				? t('error-tags-must-be-assigned-before-closing-chat')
				: '',
		);
	}, [department, tagRequired, t, tags]);

	return (
		<Modal>
			<Modal.Header>
				<Icon name='baloon-close-top-right' size={20} />
				<Modal.Title>{t('Closing_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p1'>
				<Box color='neutral-600'>{t('Close_room_description')}</Box>
				<Field marginBlock='x15'>
					<Field.Label>{t('Comment')}*</Field.Label>
					<Field.Row>
						<TextInput
							ref={inputRef}
							error={commentError}
							flexGrow={1}
							value={comment}
							onChange={handleComment}
							placeholder={t('Please_add_a_comment')}
						/>
					</Field.Row>
					<Field.Error>{commentError}</Field.Error>
				</Field>
				{Tags && (
					<Field>
						<Tags tags={tags} handler={handleTags} error={tagError} />
						<Field.Error>{tagError}</Field.Error>
					</Field>
				)}
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button disabled={!canConfirm} primary onClick={handleConfirm}>
						{t('Confirm')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CloseChatModal;
