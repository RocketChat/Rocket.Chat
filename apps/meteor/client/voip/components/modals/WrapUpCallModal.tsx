import { Box, Button, Field, FieldLabel, FieldRow, FieldHint, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Tags from '../../../components/Omnichannel/Tags';

type WrapUpCallPayload = {
	comment: string;
	tags?: string[];
};

type WrapUpCallModalProps = {
	closeRoom: (data?: { comment?: string; tags?: string[] }) => void;
};

export const WrapUpCallModal = ({ closeRoom }: WrapUpCallModalProps): ReactElement => {
	const setModal = useSetModal();

	const closeModal = (): void => setModal(null);
	const { t } = useTranslation();

	const { register, handleSubmit, setValue, watch } = useForm<WrapUpCallPayload>();

	const tags = watch('tags');

	useEffect(() => {
		register('tags');
	}, [register]);

	const handleTags = (value: string[]): void => {
		setValue('tags', value);
	};

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
					<FieldLabel>{t('Notes')}</FieldLabel>
					<FieldRow>
						<TextAreaInput placeholder={t('Do_you_have_any_notes_for_this_conversation')} {...register('comment')} />
					</FieldRow>
					<FieldHint>{t('These_notes_will_be_available_in_the_call_summary')}</FieldHint>
				</Field>
				<Field>
					<Tags tags={tags} handler={handleTags as () => void} />
				</Field>
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
