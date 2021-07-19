import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import React, { FC, memo, ReactNode } from 'react';

import AutoCompleteDepartment from '../../../../../../../client/components/AutoCompleteDepartment';
import Tags from '../../../../../../../client/components/Omnichannel/Tags';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import MarkdownTextEditor from '../../MarkdownTextEditor';
import PreviewText from './PreviewText';
import SharingOptions from './SharingOptions';

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

	const clickable = css`
		cursor: pointer;
	`;

	const { _id, shortcut, text, scope, tags, departmentId } = values;
	const { handleShortcut, handleText, handleTags, handleDepartmentId } = handlers;

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
				<Field mbe='x24'>
					<Field.Label>{t('Shortcut')}</Field.Label>
					<TextInput
						error={errors.shortcut}
						name={'shortcut'}
						placeholder={`!${t('shortcut_name')}`}
						onChange={handleShortcut}
						value={shortcut}
					/>
					<Field.Error>{errors.shortcut}</Field.Error>
				</Field>
				<Field mbe='x24'>
					<Field.Label w='full'>
						<Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
							{t('Message')}
							<Box className={clickable} color='link' onClick={onPreview}>
								{previewState ? t('Editor') : t('Preview')}
							</Box>
						</Box>
					</Field.Label>
					{previewState ? (
						<PreviewText text={text} />
					) : (
						<MarkdownTextEditor value={text} onChange={handleText} />
					)}
				</Field>
				<Field mbe='x24'>
					<Tags handler={handleTags} tags={tags} />
				</Field>
				{isManager && (
					<>
						<Field mbe='x24'>
							<Field.Label>{t('Sharing')}</Field.Label>
							<Field.Description>{radioDescription}</Field.Description>
							<Field.Row mbs='12px' justifyContent='start'>
								<SharingOptions scope={scope} radioHandlers={radioHandlers} />
							</Field.Row>
						</Field>
						{scope === 'department' && (
							<Field mbe='x24'>
								<Field.Label>{t('Department')}</Field.Label>
								<AutoCompleteDepartment
									value={departmentId}
									onChange={handleDepartmentId}
									error={errors.departmentId}
								/>
								<Field.Error>{errors.departmentId}</Field.Error>
							</Field>
						)}
					</>
				)}
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
