import { Box, Input } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import React, { useState, useMemo } from 'react';

import GenericModal from '../../../components/GenericModal';

type PermanentDepartmentRemovalModalProps = {
	_id: string;
	name: string;
	reset: () => void;
	onClose: () => void;
};

const PermanentDepartmentRemovalModal = ({ _id = '', name, reset, onClose }: PermanentDepartmentRemovalModalProps): ReactElement => {
	const t = useTranslation();
	console.log(_id);
	const [text, setText] = useState('');

	const removeDepartment = useEndpoint('DELETE', '/v1/livechat/department/:_id', { _id });
	const dispatchToast = useToastMessageDispatch();

	const onSubmit = useMutableCallback(async () => {
		try {
			await removeDepartment();
			dispatchToast({ type: 'success', message: t('Department_removed') });
			reset();
			onClose();
		} catch (error) {
			dispatchToast({ type: 'error', message: error });
		}
	});

	const disabled = useMemo(() => {
		return text !== name;
	}, [name, text]);

	return (
		<GenericModal
			onConfirm={onSubmit}
			onCancel={onClose}
			confirmText={t('Delete')}
			title={t('Delete_Department?')}
			onClose={onClose}
			variant='danger'
			confirmDisabled={disabled}
		>
			<Box mbe='x16'>{t('Are_you_sure_delete_department')}</Box>
			<Box mbe='x16' display='flex' justifyContent='stretch'>
				<Input value={text} onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value)} />
			</Box>
		</GenericModal>
	);
};

export default PermanentDepartmentRemovalModal;
