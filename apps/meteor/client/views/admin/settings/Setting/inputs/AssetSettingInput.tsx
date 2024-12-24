import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Field, FieldLabel, FieldRow, Icon, Palette } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useEndpoint, useTranslation, useUpload } from '@rocket.chat/ui-contexts';
import type { ChangeEventHandler, DragEvent, ReactElement, SyntheticEvent } from 'react';

import './AssetSettingInput.styles.css';
import type { SettingInputProps } from './types';

type AssetSettingInputProps = Omit<SettingInputProps<{ url: string }>, 'onChangeValue'> & {
	asset?: any;
	fileConstraints?: { extensions: string[] };
};

function AssetSettingInput({ _id, label, value, asset, required, disabled, fileConstraints }: AssetSettingInputProps): ReactElement {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const setAsset = useUpload('/v1/assets.setAsset');
	const unsetAsset = useEndpoint('POST', '/v1/assets.unsetAsset');

	const isDataTransferEvent = <T extends SyntheticEvent>(event: T): event is T & DragEvent<HTMLInputElement> =>
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
			fileData.append('asset', blob, blob.name);
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

	const settingsFilePreview = css`
		display: flex;
		align-items: center;

		& input[type='file'] {
			position: absolute !important;
			z-index: 10000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			cursor: pointer;
			opacity: 0;

			& * {
				cursor: pointer;
			}
		}

		& .preview {
			overflow: hidden;
			width: 100px;
			height: 40px;
			margin-right: 0.75rem;
			border-width: 1px;
			border-color: ${Palette.stroke['stroke-light']};
			border-radius: 4px;
			background-repeat: no-repeat;
			background-position: center center;
			background-size: contain;

			&.no-file {
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
	`;

	return (
		<Field>
			<FieldLabel htmlFor={_id} title={_id} required={required}>
				{label}
			</FieldLabel>
			<FieldRow>
				<Box className={settingsFilePreview}>
					{value?.url ? (
						<div
							className='preview'
							style={{ backgroundImage: `url(${value.url}?_dc=${Random.id()})` }}
							role='img'
							aria-label={t('Asset_preview')}
						/>
					) : (
						<div className='preview no-file background-transparent-light secondary-font-color'>
							<Icon size='x16' name='upload' />
						</div>
					)}
					<div className='action'>
						{value?.url ? (
							<Button icon='trash' disabled={disabled} onClick={handleDeleteButtonClick}>
								{t('Delete')}
							</Button>
						) : (
							<Box position='relative' className={`rcx-button rcx-button--primary ${disabled ? 'is-disabled' : ''}`}>
								{t('Select_file')}
								<input type='file' accept={`.${fileConstraints?.extensions?.join(', .')}`} onChange={handleUpload} disabled={disabled} />
							</Box>
						)}
					</div>
				</Box>
			</FieldRow>
		</Field>
	);
}

export default AssetSettingInput;
