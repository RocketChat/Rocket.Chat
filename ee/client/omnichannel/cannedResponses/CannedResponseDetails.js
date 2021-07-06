import { css } from '@rocket.chat/css-in-js';
import { Box, Margins, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { memo, useCallback } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client';
import GenericModal from '../../../../client/components/GenericModal';
import VerticalBar from '../../../../client/components/VerticalBar';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { withResponseData } from './withResponseData';

const breakWord = css`
	word-break: break-word;
`;

export const CannedResponseDetails = ({
	response: { shortcut, text, scope, _id },
	onEdit,
	onReturn,
	onClose,
}) => {
	const t = useTranslation();

	const setModal = useSetModal();

	const removeCannedResponse = useMethod('removeCannedResponse');

	const handleRemoveClick = useCallback(() => {
		const handleCancel = () => {
			setModal(null);
		};
		const handleDelete = () => {
			try {
				removeCannedResponse(_id);
				toastr.success(t('Canned_Response_Removed'));
				onReturn();
				handleCancel();
			} catch (error) {
				handleError(error);
			}
		};
		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={handleDelete}
				onCancel={handleCancel}
				onClose={handleCancel}
				confirmText={t('Delete')}
			>
				{t('Canned_Response_Delete_Warning')}
			</GenericModal>
		));
	}, [onReturn, removeCannedResponse, _id, setModal, t]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				<VerticalBar.Back onClick={onReturn} />
				<VerticalBar.Text>!{shortcut}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent>
				<Margins block='x4'>
					<span>
						<Box fontScale='p2'>{t('Shortcut')}:</Box>
						<Box fontScale='p1' className={[breakWord]}>
							!{shortcut}
						</Box>
					</span>

					<span>
						<Box fontScale='p2'>{t('Content')}:</Box>
						<Box mbe='x2' flexShrink={1} className={[breakWord]}>
							{text}
						</Box>
					</span>

					<span>
						<Box fontScale='p2'>{t('Scope')}:</Box>
						<Box mbs='x2' className={[breakWord]}>
							{scope}
						</Box>
					</span>
				</Margins>
			</VerticalBar.ScrollableContent>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onEdit}>
						<Icon name='pencil' mie='x4' />
						{t('Edit')}
					</Button>
					<Button primary danger onClick={handleRemoveClick}>
						<Icon name='trash' mie='x4' />
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default memo(withResponseData(CannedResponseDetails));
