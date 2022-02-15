import { Button, ButtonGroup, Field, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

// import AutoCompleteTags from '../../../../ee/client/omnichannel/tags/AutoCompleteTags';
import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';

type WrapUpCallPayload = {
	notes: string;
};

export const WrapUpCallModal = (): ReactElement => {
	const setModal = useSetModal();

	const closeModal = (): void => setModal(null);
	const t = useTranslation();

	const { register, handleSubmit } = useForm<WrapUpCallPayload>();

	const onSubmit: SubmitHandler<WrapUpCallPayload> = (data): void => {
		// TODO: Call endpoint to save WrapUp data
		console.log(data);
	};

	return (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Title>{t('Wrap_Up_the_Call')}</Modal.Title>
				<Modal.Close onClick={closeModal} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='24px'>
					<Field.Label>{t('Notes')}</Field.Label>
					<Field.Row>
						<TextAreaInput {...register('notes')} />
					</Field.Row>
					<Field.Hint>{t('These_notes_will_be_available_in_the_call_summary')}</Field.Hint>
				</Field>
				{/* {isEnterprise && (
					<Field>
						<Field.Label>{t('Tags')}</Field.Label>
						<Field.Row>
							<AutoCompleteTags />
						</Field.Row>
					</Field>
				)} */}
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={closeModal}>
						{t('Cancel')}
					</Button>
					<Button type='submit' primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};
