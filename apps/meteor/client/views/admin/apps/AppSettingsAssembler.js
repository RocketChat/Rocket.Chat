import { Box } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import React from 'react';

import AppSetting from './AppSetting';

const AppSettingsAssembler = ({ settings, values, handlers }) => (
	<Box>
		{Object.values(settings).map((current) => {
			const { id } = current;
			return <AppSetting key={id} appSetting={current} value={values[id]} onChange={handlers[`handle${capitalize(id)}`]} />;
		})}
	</Box>
);

export default AppSettingsAssembler;
