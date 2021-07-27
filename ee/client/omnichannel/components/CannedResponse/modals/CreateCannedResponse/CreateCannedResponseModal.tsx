import { Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import React, { FC, memo, ReactNode } from 'react';

import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import CannedResponseForm from '../../../../cannedResponses/components/cannedResponseForm';

const CreateCannedResponseModal: FC<{
	isManager: boolean;
	values: any;
	handlers: any;
	errors: any;
	hasUnsavedChanges: boolean;
	radioHandlers: any;
	radioDescription: string;
	onClose: (modal: ReactNode) => void;
	onSave: () => void;
	onPreview: () => void;
	previewState: boolean;
}> = ({
	isManager,
	values,
	handlers,
	errors,
	hasUnsavedChanges,
	radioHandlers,
	radioDescription,
	onClose,
	onSave,
	onPreview,
	previewState,
}) => {
	const t = useTranslation();

	const { _id, shortcut, text, scope, departmentId } = values;

	const checkDepartment = scope !== 'department' || (scope === 'department' && departmentId);

	const canSave = shortcut && text && checkDepartment;

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{_id ? t('Edit_Canned_Response') : t('Create_Canned_Response')}</Modal.Title>
				<Modal.Close
					onClick={(): void => {
						onClose(null);
					}}
				/>
			</Modal.Header>
			<Modal.Content fontScale='p1'>
				<CannedResponseForm
					isManager={isManager}
					values={values}
					handlers={handlers}
					errors={errors}
					radioHandlers={radioHandlers}
					radioDescription={radioDescription}
					onPreview={onPreview}
					previewState={previewState}
				></CannedResponseForm>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button
						onClick={(): void => {
							onClose(null);
						}}
					>
						{t('Cancel')}
					</Button>
					<Button primary disabled={!hasUnsavedChanges || !canSave} onClick={onSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateCannedResponseModal);
