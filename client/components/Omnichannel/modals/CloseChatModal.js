import { Field, Button, TextInput, Icon, ButtonGroup, Modal, Box } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useForm } from '../../../hooks/useForm';
import { formsSubscription } from '../../../views/omnichannel/additionalForms';

const CloseChatModal = ({ onCancel, onConfirm, ...props }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);
	const forms = useSubscription(formsSubscription);

	const { useCurrentChatTags = () => {} } = forms;

	const Tags = useCurrentChatTags();

	const { values, handlers } = useForm({ comment: '', tags: [] });

	const { comment, tags } = values;
	const { handleComment, handleTags } = handlers;
	const [commentError, setCommentError] = useState('');

	const handleConfirm = useCallback(() => {
		onConfirm(comment, tags);
	}, [comment, onConfirm, tags]);

	useComponentDidUpdate(() => {
		setCommentError(!comment ? t('The_field_is_required', t('Comment')) : '');
	}, [t, comment]);

	const canConfirm = useMemo(() => !!comment, [comment]);

	return (
		<Modal {...props}>
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
						<Field.Label mb='x4'>{t('Tags')}</Field.Label>
						<Field.Row>
							<Tags value={tags} handler={handleTags} />
						</Field.Row>
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
