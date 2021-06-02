import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import Tags from '../../../../../../../client/components/Omnichannel/Tags';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import SharingOptions from './SharingOptions';

const CreateCannedResponseModal: FC<{
	isManager: boolean;
	form: any;
	radioHandlers: any;
	radioDescription: string;
	onClose: () => void;
	onSave: () => void;
	onPreview: () => void;
}> = ({ isManager, form, radioHandlers, radioDescription, onClose, onSave, onPreview }) => {
	const t = useTranslation();

	const clickable = css`
		cursor: pointer;
	`;

	const { values, handlers, errors } = form;

	return (
		<Modal>
			<Modal.Header>
				{/* <Modal.Title>{t('Create_Canned_Response')}</Modal.Title> */}
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p1'>
				<Field mbe='x24'>
					<Field.Label>{t('Shortcut')}</Field.Label>
					<TextInput
						name={'shortcut'}
						// placeholder={`!${t('shortcut_name')}`}
						error={errors && errors.shortcut}
						onChange={handlers && handlers.shortcut}
						value={values && values.shortcut}
					/>
				</Field>
				<Field mbe='x24'>
					<Field.Label w='full'>
						<Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
							{t('Message')}
							<Box className={clickable} color='link' onClick={onPreview}>
								{/* {t('Preview')} */}
							</Box>
						</Box>
					</Field.Label>
					<TextInput />
				</Field>
				<Field mbe='x24'>
					<Tags
						error={errors && errors.tags}
						handler={handlers && handlers.tags}
						tags={values && values.tags}
					/>
				</Field>
				{isManager && (
					<>
						<Field mbe='x24'>
							{/* <Field.Label>{t('Sharing')}</Field.Label> */}
							<Field.Description>{radioDescription}</Field.Description>
						</Field>
						<SharingOptions radioHandlers={radioHandlers} />
					</>
				)}
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={onSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateCannedResponseModal);
