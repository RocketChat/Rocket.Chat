import { css } from '@rocket.chat/css-in-js';
import { Box, Field, FieldLabel, FieldRow, FieldError, FieldDescription, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import AutoCompleteDepartment from '../../../../../client/components/AutoCompleteDepartment';
import Tags from '../../../../../client/components/Omnichannel/Tags';
import MarkdownTextEditor from '../../components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import SharingOptions from '../../components/CannedResponse/modals/CreateCannedResponse/SharingOptions';

const CannedResponseForm: FC<{
	isManager: boolean;
	isMonitor: boolean;
	values: any;
	handlers: any;
	errors: any;
	radioHandlers: {
		setPublic: () => void;
		setDepartment: () => void;
		setPrivate: () => void;
	};
	radioDescription: string;
	onPreview: () => void;
	previewState: boolean;
}> = ({ values, handlers, errors, radioHandlers, radioDescription, onPreview, previewState, isManager, isMonitor }) => {
	const { shortcut, text, scope, tags, departmentId } = values;
	const { handleShortcut, handleText, handleTags, handleDepartmentId } = handlers;
	const t = useTranslation();

	const clickable = css`
		cursor: pointer;
	`;

	return (
		<>
			<Field mbe={24}>
				<FieldLabel>{t('Shortcut')}</FieldLabel>
				<TextInput
					error={errors.shortcut}
					name='shortcut'
					placeholder={`!${t('shortcut_name')}`}
					onChange={handleShortcut}
					value={shortcut}
				/>
				<FieldError>{errors.shortcut}</FieldError>
			</Field>
			<Field mbe={24}>
				<FieldLabel w='full'>
					<Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
						{t('Message')}
						<Box className={clickable} color='info' onClick={onPreview}>
							{previewState ? t('Editor') : t('Preview')}
						</Box>
					</Box>
				</FieldLabel>
				{previewState ? <PreviewText text={text} /> : <MarkdownTextEditor value={text} onChange={handleText} />}
			</Field>
			<Field mbe={24}>
				<Tags handler={handleTags} tags={tags} />
			</Field>
			{(isManager || isMonitor) && (
				<>
					<Field mbe={24}>
						<FieldLabel>{t('Sharing')}</FieldLabel>
						<FieldDescription>{radioDescription}</FieldDescription>
						<FieldRow mbs='12px' justifyContent='start'>
							<SharingOptions isMonitor={isMonitor} isManager={isManager} scope={scope} radioHandlers={radioHandlers} />
						</FieldRow>
					</Field>
					{scope === 'department' && (
						<Field mbe={24}>
							<FieldLabel>{t('Department')}</FieldLabel>
							<AutoCompleteDepartment
								{...(isMonitor && { onlyMyDepartments: isMonitor })}
								value={departmentId}
								onChange={handleDepartmentId}
							/>
							<FieldError>{errors.departmentId}</FieldError>
						</Field>
					)}
				</>
			)}
		</>
	);
};

export default CannedResponseForm;
