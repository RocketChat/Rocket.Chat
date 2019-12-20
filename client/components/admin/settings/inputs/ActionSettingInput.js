import { Button, Field } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React from 'react';
import toastr from 'toastr';

import { useTranslation } from '../../../providers/TranslationProvider';
import { handleError } from '../../../../../app/utils/client';

export function ActionSettingInput({
	_id,
	actionText,
	value,
	disabled,
	sectionChanged,
}) {
	const t = useTranslation();

	const handleClick = async () => {
		Meteor.call(value, (err, data) => {
			if (err) {
				err.details = Object.assign(err.details || {}, {
					errorTitle: 'Error',
				});
				handleError(err);
				return;
			}

			const args = [data.message].concat(data.params);
			toastr.success(TAPi18n.__.apply(TAPi18n, args), TAPi18n.__('Success'));
		});
	};

	return <>
		<Button
			data-qa-setting-id={_id}
			children={t(actionText)}
			disabled={disabled || sectionChanged}
			primary
			onClick={handleClick}
		/>
		{sectionChanged && <Field.Hint>{t('Save_to_enable_this_action')}</Field.Hint>}
	</>;
}
