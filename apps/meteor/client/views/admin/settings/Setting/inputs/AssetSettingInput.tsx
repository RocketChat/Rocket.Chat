import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Field, FieldHint, FieldLabel, FieldRow, Icon, Palette } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useEndpoint, useTranslation, useUpload } from '@rocket.chat/ui-contexts';
import type { ChangeEventHandler, DragEvent, SyntheticEvent } from 'react';
import { useId } from 'react';

import type { SettingInputProps } from './types';

export type AssetSettingInputProps = Omit<SettingInputProps<{ url: string }>, 'onChangeValue'> & {
	asset?: any;
	fileConstraints?: { extensions: string[] };
};

function AssetSettingInput({ _id, label, value, hint, asset, required, disabled, fileConstraints }: AssetSettingInputProps) {
	const t = useTranslation();
	const labelId = useId();

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

		/* A file input's label can't be a Button, so it carries the primary look of one */
		& .rcx-button {
			overflow: hidden;
			display: inline-block;
			min-width: 5rem;
			height: 2.5rem;
			padding-block: calc((2.5rem - 1.25rem) / 2 - 2px);
			padding-inline: calc(16px - 2px);
			border: var(--rcx-button-border-width, 1px) solid
				var(--rcx-button-primary-border-color, var(--rcx-color-button-background-primary-default, #156ff5));
			border-radius: var(--rcx-button-border-radius, var(--rcx-border-radius-medium, 0.25rem));
			background-color: var(--rcx-button-primary-background-color, var(--rcx-color-button-background-primary-default, #156ff5));
			color: var(--rcx-button-primary-color, var(--rcx-color-button-font-on-primary, #fff));
			font-size: 0.875rem;
			font-weight: 500;
			line-height: 1.25rem;
			text-align: center;
			text-overflow: ellipsis;
			white-space: nowrap;
			cursor: pointer;

			&:hover {
				border-color: var(--rcx-button-primary-hover-border-color, var(--rcx-color-button-background-primary-hover, #095ad2));
				background-color: var(--rcx-button-primary-hover-background-color, var(--rcx-color-button-background-primary-hover, #095ad2));
			}

			&:active {
				border-color: var(--rcx-button-primary-active-border-color, var(--rcx-color-button-background-primary-press, #10529e));
				background-color: var(--rcx-button-primary-active-background-color, var(--rcx-color-button-background-primary-press, #10529e));
			}

			&.is-disabled {
				border-color: var(--rcx-button-primary-disabled-border-color, var(--rcx-color-button-background-primary-disabled, #d1ebfe));
				background-color: var(--rcx-button-primary-disabled-background-color, var(--rcx-color-button-background-primary-disabled, #d1ebfe));
				color: var(--rcx-button-primary-disabled-color, var(--rcx-color-button-font-on-primary-disabled, #fff));
				cursor: not-allowed;
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
							<Box position='relative' className={`rcx-button rcx-button--primary ${disabled ? 'is-disabled' : ''}`}>
								{t('Select_file')}
								<input
									id={_id}
									type='file'
									accept={`.${fileConstraints?.extensions?.join(', .')}`}
									onChange={handleUpload}
									disabled={disabled}
								/>
							</Box>
						)}
					</div>
				</Box>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default AssetSettingInput;
