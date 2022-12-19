import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Field, Button, TextInput, Modal, Box } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../GenericModal';
import Tags from '../Tags';

const CloseChatModal = ({
	department,
	onCancel,
	onConfirm,
}: {
	department?: ILivechatDepartment | null;
	onCancel: () => void;
	onConfirm: (comment?: string, tags?: string[]) => Promise<void>;
}): ReactElement => {
	const t = useTranslation();

	const {
		formState: { errors },
		handleSubmit,
		register,
		setError,
		setFocus,
		setValue,
		watch,
	} = useForm();

	const commentRequired = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;
	const [tagRequired, setTagRequired] = useState(false);

	const tags = watch('tags');
	const comment = watch('comment');

	const handleTags = (value: string[]): void => {
		setValue('tags', value);
	};

	const onSubmit = useCallback(
		({ comment, tags }): void => {
			if (!comment && commentRequired) {
				setError('comment', { type: 'custom', message: t('The_field_is_required', t('Comment')) });
			}

			if (!tags?.length && tagRequired) {
				setError('tags', { type: 'custom', message: t('error-tags-must-be-assigned-before-closing-chat') });
			}

			if (!errors.comment || errors.tags) {
				onConfirm(comment, tags);
			}
		},
		[commentRequired, tagRequired, errors, setError, t, onConfirm],
	);

	const cannotSubmit = useMemo(() => {
		const cannotSendTag = (tagRequired && !tags?.length) || errors.tags;
		const cannotSendComment = (commentRequired && !comment) || errors.comment;
		return Boolean(cannotSendTag || cannotSendComment);
	}, [comment, commentRequired, errors, tagRequired, tags]);

	useEffect(() => {
		if (department?.requestTagBeforeClosingChat) {
			setTagRequired(true);
		}
	}, [department]);

	useEffect(() => {
		if (commentRequired) {
			setFocus('comment');
		}
	}, [commentRequired, setFocus]);

	useEffect(() => {
		if (tagRequired) {
			register('tags');
		}
	}, [register, tagRequired]);

	return commentRequired || tagRequired ? (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Icon name='baloon-close-top-right' />
				<Modal.Title>{t('Closing_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box color='annotation'>{t('Close_room_description')}</Box>
				<Field marginBlock='x15'>
					<Field.Label required={commentRequired}>{t('Comment')}</Field.Label>
					<Field.Row>
						<TextInput
							{...register('comment')}
							error={
								errors.comment &&
								t('error-the-field-is-required', {
									field: t('Comment'),
								})
							}
							flexGrow={1}
							placeholder={t('Please_add_a_comment')}
						/>
					</Field.Row>
					<Field.Error>{errors.comment?.message}</Field.Error>
				</Field>
				<Field>
					<Tags tagRequired={tagRequired} tags={tags} handler={handleTags} />
					<Field.Error>{errors.tags?.message}</Field.Error>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button type='submit' disabled={cannotSubmit} primary>
						{t('Confirm')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	) : (
		<GenericModal
			variant='warning'
			title={t('Are_you_sure_you_want_to_close_this_chat')}
			onConfirm={(): Promise<void> => onConfirm()}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Confirm')}
		></GenericModal>
	);
};

export default CloseChatModal;
