import { Box, Input } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

type RemoveDepartmentModalProps = {
	_id: string;
	name: string;
	reset: () => void;
	onClose: () => void;
};

const RemoveDepartmentModal = ({ _id = '', name, reset, onClose }: RemoveDepartmentModalProps): ReactElement => {
	const { t } = useTranslation();
	const [text, setText] = useState('');

	const removeDepartment = useEndpoint('DELETE', '/v1/livechat/department/:_id', { _id });
	const dispatchToast = useToastMessageDispatch();

	const onSubmit = useEffectEvent(async (e: FormEvent) => {
		e.preventDefault();

		try {
			await removeDepartment();
			dispatchToast({ type: 'success', message: t('Department_removed') });
			reset();
			onClose();
		} catch (error) {
			dispatchToast({ type: 'error', message: error });
		}
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onSubmit} {...props} />}
			onCancel={onClose}
			confirmText={t('Delete')}
			title={t('Delete_Department?')}
			onClose={onClose}
			variant='danger'
			data-qa-id='delete-department-modal'
			confirmDisabled={text !== name}
		>
			<Box mbe={16}>{t('Are_you_sure_delete_department')}</Box>
			<Box mbe={16} display='flex' justifyContent='stretch'>
				<Input
					value={text}
					name='confirmDepartmentName'
					onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value)}
				/>
			</Box>
		</GenericModal>
	);
};

export default RemoveDepartmentModal;
