import { Button, ModalFooter, ModalFooterAnnotation, ModalFooterControllers } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type CreateRoomStepsFooterProps = {
	index: number;
	total: number;
	onCancel: () => void;
	onBack: () => void;
	submitDisabled?: boolean;
	isSubmitting?: boolean;
};

const CreateRoomStepsFooter = ({ index, total, onCancel, onBack, submitDisabled, isSubmitting }: CreateRoomStepsFooterProps) => {
	const { t } = useTranslation();
	const isStepped = total > 1;

	return (
		<ModalFooter justifyContent={isStepped ? 'space-between' : undefined}>
			{isStepped && <ModalFooterAnnotation>{t('Step_of_total', { step: index + 1, total })}</ModalFooterAnnotation>}
			<ModalFooterControllers>
				{index === 0 ? <Button onClick={onCancel}>{t('Cancel')}</Button> : <Button onClick={onBack}>{t('Back')}</Button>}
				<Button type='submit' primary disabled={submitDisabled} loading={isSubmitting}>
					{index === total - 1 ? t('Create') : t('Next')}
				</Button>
			</ModalFooterControllers>
		</ModalFooter>
	);
};

export default CreateRoomStepsFooter;
