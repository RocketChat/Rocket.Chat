import { Button, Field, Icon } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation, useUpload } from '@rocket.chat/ui-contexts';
import { Random } from 'meteor/random';
import React, { ChangeEventHandler, DragEvent, ReactElement } from 'react';

import './AssetSettingInput.styles.css';

type AssetSettingInputProps = {
	_id: string;
	label: string;
	value?: { url: string };
	asset?: any;
	fileConstraints?: { extensions: string[] };
};

function AssetSettingInput({ _id, label, value, asset, fileConstraints }: AssetSettingInputProps): ReactElement {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const setAsset = useUpload('/v1/assets.setAsset');
	const unsetAsset = useEndpoint('POST', '/v1/assets.unsetAsset');

	const isDataTransferEvent = <T,>(event: T): event is T & DragEvent<HTMLInputElement> =>
		Boolean('dataTransfer' in event && (event as any).dataTransfer.files);

	const handleUpload: ChangeEventHandler<HTMLInputElement> = (event): void => {
		let { files } = event.target;

		if (!files || files.length === 0) {
			if (isDataTransferEvent(event)) {
				files = event.dataTransfer.files;
			}
		}

		Object.values(files ?? []).forEach(async (blob) => {
			dispatchToastMessage({ type: 'info', message: t('Uploading_file') });

			const fileData = new FormData();
			fileData.append('asset', blob, asset);
			fileData.append('assetName', asset);

			try {
				await setAsset(fileData);
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		});
	};

	const handleDeleteButtonClick = async (): Promise<void> => {
		try {
			await unsetAsset({ assetName: asset });
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
					{value?.url ? (
						<div className='preview' style={{ backgroundImage: `url(${value.url}?_dc=${Random.id()})` }} />
					) : (
						<div className='preview no-file background-transparent-light secondary-font-color'>
							<Icon name='upload' />
						</div>
					)}
					<div className='action'>
						{value?.url ? (
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
									accept={`.${fileConstraints?.extensions?.join(', .')}`}
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
