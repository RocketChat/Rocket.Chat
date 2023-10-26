import { Select } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context } from '../../Context';
import { surfaceAction } from '../../Context/action';
import options from './options';

const SurfaceSelect: FC = () => {
	const {
		state: { surface },
		dispatch,
	} = useContext(context);
	return (
		<Select
			options={options}
			value={`${surface}`}
			placeholder='Surface'
			onChange={(e) => {
				dispatch(surfaceAction(typeof e === 'string' ? parseInt(e) : e));
			}}
		/>
	);
};

export default SurfaceSelect;
