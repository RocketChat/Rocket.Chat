import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Field, FieldHint, FieldLabel, FieldRow, Icon, Palette } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useEndpoint, useUpload } from '@rocket.chat/ui-contexts';
import type { DragEvent } from 'react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { SettingInputProps } from './types';

export type AssetSettingInputProps = Omit<SettingInputProps<{ url: string }>, 'onChangeValue'> & {
	asset?: any;
	fileConstraints?: { extensions: string[] };
};

function AssetSettingInput({ _id, label, value, hint, asset, required, disabled, fileConstraints }: AssetSettingInputProps) {
	const { t } = useTranslation();
	const labelId = useId();
	const buttonId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const dispatchToastMessage = useToastMessageDispatch();
	const setAsset = useUpload('/v1/assets.setAsset');
	const unsetAsset = useEndpoint('POST', '/v1/assets.unsetAsset');

	const uploadFiles = (files: FileList | null): void => {
		Array.from(files ?? []).forEach(async (blob) => {
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

	const handleDrop = (event: DragEvent<HTMLButtonElement>): void => {
		event.preventDefault();
		if (!disabled) {
			uploadFiles(event.dataTransfer.files);
		}
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
			<FieldRow>
				<FieldLabel id={labelId} htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
			</FieldRow>
			<FieldRow>
				<Box role='group' aria-labelledby={labelId} className={settingsFilePreview}>
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
							<>
								<Button
									id={buttonId}
									aria-labelledby={`${labelId} ${buttonId}`}
									variant='primary'
									disabled={disabled}
									onClick={() => fileInputRef.current?.click()}
									onDragOver={(event) => event.preventDefault()}
									onDrop={handleDrop}
								>
									{t('Select_file')}
								</Button>
								<input
									ref={fileInputRef}
									id={_id}
									type='file'
									hidden
									accept={`.${fileConstraints?.extensions?.join(', .')}`}
									onChange={(event) => uploadFiles(event.target.files)}
									disabled={disabled}
								/>
							</>
						)}
					</div>
				</Box>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default AssetSettingInput;
