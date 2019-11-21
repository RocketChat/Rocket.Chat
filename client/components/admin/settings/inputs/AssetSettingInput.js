import { Button, Icon, Label } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../../app/utils/client';
import { useTranslation } from '../../../providers/TranslationProvider';

export function AssetSettingInput({
	_id,
	label,
	value,
	asset,
	fileConstraints,
}) {
	const t = useTranslation();

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
			toastr.info(TAPi18n.__('Uploading_file'));
			const reader = new FileReader();
			reader.readAsBinaryString(blob);
			reader.onloadend = () => Meteor.call('setAsset', reader.result, blob.type, asset, function(err) {
				if (err != null) {
					handleError(err);
					console.log(err);
					return;
				}
				return toastr.success(TAPi18n.__('File_uploaded'));
			});
		});
	};

	const handleDeleteButtonClick = () => {
		Meteor.call('unsetAsset', asset);
	};

	return <>
		<Label htmlFor={_id} text={label} title={_id} />
		<div className='settings-file-preview'>
			{value.url
				? <div className='preview' style={{ backgroundImage: `url(${ value.url }?_dc=${ Random.id() })` }} />
				: <div className='preview no-file background-transparent-light secondary-font-color'><Icon icon='icon-upload' /></div>}
			<div className='action'>
				{value.url
					? <Button onClick={handleDeleteButtonClick}>
						<Icon name='trash' />{t('Delete')}
					</Button>
					: <div className='rc-button rc-button--primary'>{t('Select_file')}
						<input
							type='file'
							accept={fileConstraints.extensions && fileConstraints.extensions.length && `.${ fileConstraints.extensions.join(', .') }`}
							onChange={handleUpload}
						/>
					</div>}
			</div>
		</div>
	</>;
}
