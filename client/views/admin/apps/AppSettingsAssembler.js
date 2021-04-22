import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { capitalize } from '../../../lib/capitalize';
import AppSetting from './AppSetting';

const AppSettingsAssembler = ({ settings, values, handlers }) => (
	<Box>
		{Object.values(settings).map((current) => {
			const { id } = current;
			return (
				<AppSetting
					key={id}
					appSetting={current}
					value={values[id]}
					onChange={handlers[`handle${capitalize(id)}`]}
				/>
			);
		})}
	</Box>
);

export default AppSettingsAssembler;
