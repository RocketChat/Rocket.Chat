import { Field, Button, TextInput, Icon, ButtonGroup, Modal, Box } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useForm } from '../../../hooks/useForm';
import GenericModal from '../../GenericModal';
import Tags from '../Tags';

const CloseChatModal = ({ department = {}, onCancel, onConfirm }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);

	const { values, handlers } = useForm({ comment: '', tags: [] });

	const commentRequired = useSetting('Livechat_request_comment_when_closing_conversation');

	const { comment, tags } = values;
	const { handleComment, handleTags } = handlers;
	const [commentError, setCommentError] = useState('');
	const [tagError, setTagError] = useState('');
	const [tagRequired, setTagRequired] = useState(false);

	const handleConfirm = useCallback(() => {
		onConfirm(comment, tags);
	}, [comment, onConfirm, tags]);

	useComponentDidUpdate(() => {
		setCommentError(!comment && commentRequired ? t('The_field_is_required', t('Comment')) : '');
	}, [commentRequired, comment, t]);

	const canConfirm = useMemo(() => {
		const canConfirmTag = !tagError && (tagRequired ? tags.length > 0 : true);
		const canConfirmComment = !commentError && (commentRequired ? !!comment : true);
		return canConfirmTag && canConfirmComment;
	}, [comment, commentError, commentRequired, tagError, tagRequired, tags.length]);

	useEffect(() => {
		department?.requestTagBeforeClosingChat && setTagRequired(true);
		setTagError(tagRequired && (!tags || tags.length === 0) ? t('error-tags-must-be-assigned-before-closing-chat') : '');
	}, [department, tagRequired, t, tags]);

	if (!commentRequired && !tagRequired) {
		return (
			<GenericModal
				variant='warning'
				title={t('Are_you_sure_you_want_to_close_this_chat')}
				onConfirm={handleConfirm}
				onCancel={onCancel}
				onClose={onCancel}
				confirmText={t('Confirm')}
			></GenericModal>
		);
	}

	return (
		<Modal>
			<Modal.Header>
				<Icon name='baloon-close-top-right' size={20} />
				<Modal.Title>{t('Closing_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box color='neutral-600'>{t('Close_room_description')}</Box>
				<Field marginBlock='x15'>
					<Field.Label required={commentRequired}>{t('Comment')}</Field.Label>
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
						<Tags tagRequired={tagRequired} tags={tags} handler={handleTags} error={tagError} />
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
