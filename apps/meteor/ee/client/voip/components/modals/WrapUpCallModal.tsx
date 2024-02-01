import { Box, Button, Field, FieldLabel, FieldRow, FieldHint, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import Tags from '../../../../../client/components/Omnichannel/Tags';

type WrapUpCallPayload = {
	comment: string;
	tags?: string[];
};

type WrapUpCallModalProps = {
	closeRoom: (data?: { comment?: string; tags?: string[] }) => void;
};

export const WrapUpCallModal = ({ closeRoom }: WrapUpCallModalProps): ReactElement => {
	const setModal = useSetModal();
	const notesId = useUniqueId();
	const notesDescId = useUniqueId();

	const closeModal = (): void => setModal(null);
	const t = useTranslation();

	const { register, handleSubmit, control } = useForm<WrapUpCallPayload>();

	const onSubmit: SubmitHandler<WrapUpCallPayload> = (data: { comment?: string; tags?: string[] }): void => {
		closeRoom(data);
		closeModal();
	};

	const onCancel = (): void => {
		closeRoom();
		closeModal();
	};

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(onSubmit)} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Wrap_up_the_call')}</Modal.Title>
				<Modal.Close onClick={closeModal} />
			</Modal.Header>

			<Modal.Content>
				<Field mbe='24px'>
					<FieldLabel aria-labelledby={notesId} aria-describedby={notesDescId}>
						{t('Notes')}
					</FieldLabel>
					<FieldRow>
						<TextAreaInput id={notesId} placeholder={t('Do_you_have_any_notes_for_this_conversation')} {...register('comment')} />
					</FieldRow>
					<FieldHint id={notesDescId}>{t('These_notes_will_be_available_in_the_call_summary')}</FieldHint>
				</Field>

				<Controller name='tags' control={control} render={({ field: { onChange, value } }) => <Tags tags={value} handler={onChange} />} />
			</Modal.Content>

			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					<Button type='submit' primary>
						{t('Save')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
