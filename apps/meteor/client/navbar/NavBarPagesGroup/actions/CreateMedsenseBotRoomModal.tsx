import {
	Box,
	Button,
	Field,
	FieldGroup,
	FieldRow,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useSetting, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { memo, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { goToRoomById } from '../../../lib/utils/goToRoomById';

type CreateMedsenseBotRoomModalProps = {
	onClose: () => void;
};

type CreateMedsenseBotRoomForm = {
	greeting: string;
};

const CreateMedsenseBotRoomModal = ({ onClose }: CreateMedsenseBotRoomModalProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const createMedsenseBotRoom = useMethod('medsenseCreateBotRoom');
	const greetingSetting = useSetting<string>('Medsense_Start_Chat_Greeting', '');
	const labelSetting = useSetting<string>('Medsense_Start_Chat_Label', '');
	const modalTitle = labelSetting.trim().length > 0 ? labelSetting : t('Medsense_Start_Bot_Chat');
	const defaultGreeting = greetingSetting.trim();
	const formId = useId();
	const greetingFieldId = useId();

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<CreateMedsenseBotRoomForm>({
		mode: 'onBlur',
		defaultValues: { greeting: '' },
	});

	const handleCreate = async ({ greeting }: CreateMedsenseBotRoomForm) => {
		const trimmedGreeting = typeof greeting === 'string' ? greeting.trim() : '';

		try {
			const rid = await createMedsenseBotRoom({ greeting: trimmedGreeting });
			if (rid) {
				goToRoomById(rid);
			}
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Modal
			aria-labelledby={`${formId}-title`}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
		>
			<ModalHeader>
				<ModalTitle id={`${formId}-title`}>{modalTitle}</ModalTitle>
				<ModalClose tabIndex={-1} onClick={onClose} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<FieldGroup>
					<Field>
						{defaultGreeting && (
							<Box mbe={8} fontScale='p2' color='hint'>
								{defaultGreeting}
							</Box>
						)}
						<FieldRow>
							<Controller
								name='greeting'
								control={control}
								render={({ field }) => (
									<TextAreaInput
										id={greetingFieldId}
										rows={3}
										{...field}
									/>
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button loading={isSubmitting} type='submit' primary>
						{t('Create')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default memo(CreateMedsenseBotRoomModal);
