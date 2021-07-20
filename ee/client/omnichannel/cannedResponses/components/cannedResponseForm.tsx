import { css } from '@rocket.chat/css-in-js';
import { Box, Field, TextInput } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import AutoCompleteDepartment from '../../../../../client/components/AutoCompleteDepartment';
import Tags from '../../../../../client/components/Omnichannel/Tags';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import MarkdownTextEditor from '../../components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import SharingOptions from '../../components/CannedResponse/modals/CreateCannedResponse/SharingOptions';

const CannedResponseForm: FC<{
	isManager: boolean;
	values: any;
	handlers: any;
	errors: any;
	radioHandlers: any;
	radioDescription: string;
	onPreview: () => void;
	previewState: boolean;
}> = ({
	values,
	handlers,
	errors,
	radioHandlers,
	radioDescription,
	onPreview,
	previewState,
	isManager,
}) => {
	const { shortcut, text, scope, tags, departmentId } = values;
	const { handleShortcut, handleText, handleTags, handleDepartmentId } = handlers;
	const t = useTranslation();

	const clickable = css`
		cursor: pointer;
	`;

	return (
		<>
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
		</>
	);
};

export default CannedResponseForm;
