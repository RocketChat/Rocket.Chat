import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Field, FieldHint, FieldLabel, FieldRow, Icon, Palette } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useEndpoint, useTranslation, useUpload } from '@rocket.chat/ui-contexts';
import type { ChangeEventHandler, DragEvent, SyntheticEvent } from 'react';
import { useId, useRef } from 'react';

import type { SettingInputProps } from './types';

export type AssetSettingInputProps = Omit<SettingInputProps<{ url: string }>, 'onChangeValue'> & {
	asset?: any;
	fileConstraints?: { extensions: string[] };
};

function AssetSettingInput({ _id, label, value, hint, asset, required, disabled, fileConstraints }: AssetSettingInputProps) {
	const t = useTranslation();
	const labelId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);

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
								<Button variant='primary' disabled={disabled} onClick={() => fileInputRef.current?.click()}>
									{t('Select_file')}
								</Button>
								<input
									ref={fileInputRef}
									id={_id}
									type='file'
									hidden
									accept={`.${fileConstraints?.extensions?.join(', .')}`}
									onChange={handleUpload}
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
