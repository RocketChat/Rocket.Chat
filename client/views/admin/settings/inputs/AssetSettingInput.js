import { Button, Field, Icon } from '@rocket.chat/fuselage';
import { Random } from 'meteor/random';
import React from 'react';

import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import './AssetSettingInput.css';

function AssetSettingInput({ _id, label, value = {}, asset, fileConstraints = {} }) {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const setAsset = useMethod('setAsset');
	const unsetAsset = useMethod('unsetAsset');

	const handleUpload = (event) => {
		event = event.originalEvent || event;

		let { files } = event.target;
		if (!files || files.length === 0) {
			if (event.dataTransfer && event.dataTransfer.files) {
				files = event.dataTransfer.files;
			} else {
				files = [];
			}
		}

		Object.values(files).forEach((blob) => {
			dispatchToastMessage({ type: 'info', message: t('Uploading_file') });
			const reader = new FileReader();
			reader.readAsBinaryString(blob);
			reader.onloadend = async () => {
				try {
					await setAsset(reader.result, blob.type, asset);
					dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};
		});
	};

	const handleDeleteButtonClick = async () => {
		try {
			await unsetAsset(asset);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<>
			<Field.Label htmlFor={_id} title={_id}>
				{label}
			</Field.Label>
			<Field.Row>
				<div className='settings-file-preview'>
					{value.url ? (
						<div className='preview' style={{ backgroundImage: `url(${value.url}?_dc=${Random.id()})` }} />
					) : (
						<div className='preview no-file background-transparent-light secondary-font-color'>
							<Icon name='upload' />
						</div>
					)}
					<div className='action'>
						{value.url ? (
							<Button onClick={handleDeleteButtonClick}>
								<Icon name='trash' />
								{t('Delete')}
							</Button>
						) : (
							<div className='rc-button rc-button--primary'>
								{t('Select_file')}
								<input
									className='AssetSettingInput__input'
									type='file'
									accept={fileConstraints.extensions && fileConstraints.extensions.length && `.${fileConstraints.extensions.join(', .')}`}
									onChange={handleUpload}
								/>
							</div>
						)}
					</div>
				</div>
			</Field.Row>
		</>
	);
}

export default AssetSettingInput;
