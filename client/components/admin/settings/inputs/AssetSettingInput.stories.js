import React from 'react';

import { AssetSettingInput } from './AssetSettingInput';

export default {
	title: 'admin/settings/inputs/AssetSettingInput',
	component: AssetSettingInput,
};

export const _default = () =>
	<AssetSettingInput
		_id='setting_id'
		label='Label'
	/>;

export const disabled = () =>
	<AssetSettingInput
		_id='setting_id'
		label='Label'
		disabled
	/>;

export const withValue = () =>
	<AssetSettingInput
		_id='setting_id'
		label='Label'
		value={{ src: 'https://open.rocket.chat/images/logo/logo.svg' }}
		disabled
	/>;


export const withFileConstraints = () =>
	<AssetSettingInput
		_id='setting_id'
		label='Label'
		fileConstraints={{ extensions: ['png', 'jpg', 'gif'] }}
		disabled
	/>;
