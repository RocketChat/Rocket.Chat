import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ReactNode } from 'react';
import React, { memo } from 'react';

import CannedResponseForm from '../../../../cannedResponses/components/cannedResponseForm';

const CreateCannedResponseModal: FC<{
	isManager: boolean;
	isMonitor: boolean;
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
	isMonitor,
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
				<Modal.Title>{_id ? t('Edit_Canned_Response') : t('Create_canned_response')}</Modal.Title>
				<Modal.Close
					onClick={(): void => {
						onClose(null);
					}}
				/>
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<CannedResponseForm
					isManager={isManager}
					isMonitor={isMonitor}
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
				<Modal.FooterControllers>
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
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateCannedResponseModal);
