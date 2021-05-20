import { ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, useState, useCallback } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client';
import DeleteWarningModal from '../../../../client/components/DeleteWarningModal';
import VerticalBar from '../../../../client/components/VerticalBar';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import CannedResponsesForm from './CannedResponseForm';
import { withResponseData } from './withResponseData';

export const CannedResponseEdit = ({ response, onSave, onReturn, onClose }) => {
	const t = useTranslation();
	const [errors, setErrors] = useState();

	const { values, handlers } = useForm({ shortcut: response.shortcut, text: response.text });
	const { shortcut, text } = values;
	const setModal = useSetModal();

	const handleSave = useMutableCallback(() => {
		if (!shortcut) {
			return setErrors({ shortcut: t('The_field_is_required', 'shortcut') });
		}
		if (!text) {
			return setErrors({ text: t('The_field_is_required', 'text') });
		}

		setErrors({});

		onSave(values, response._id);
		onReturn();
	});

	const removeCannedResponse = useMethod('removeCannedResponse');

	const handleRemoveClick = useCallback(() => {
		const handleCancel = () => {
			setModal(null);
		};
		const handleDelete = () => {
			try {
				removeCannedResponse(response._id);
				toastr.success(t('Canned_Response_Removed'));
				onReturn();
				handleCancel();
			} catch (error) {
				handleError(error);
			}
		};
		setModal(() => (
			<DeleteWarningModal
				children={t('Canned_Response_Delete_Warning')}
				onDelete={handleDelete}
				onCancel={handleCancel}
			/>
		));
	}, [onReturn, removeCannedResponse, response._id, setModal, t]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				<VerticalBar.Back onClick={onReturn} />
				<VerticalBar.Text>{t('Edit_Canned_Responses')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<CannedResponsesForm errors={errors} values={values} handlers={handlers} />
			</VerticalBar.ScrollableContent>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onReturn}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full'>
					<Button primary danger onClick={handleRemoveClick}>
						<Icon name='trash' mie='x4' />
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default memo(withResponseData(CannedResponseEdit));
