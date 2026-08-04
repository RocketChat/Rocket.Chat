import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useContext } from 'react';

import NavPanel from './NavPanel';
import Wrapper from './Wrapper';
import { context, previewTabsToggleAction } from '../../Context';

const Preview = () => {
	const {
		state: { isMobile, isTablet },
		dispatch,
	} = useContext(context);

	useEffect(() => {
		dispatch(previewTabsToggleAction(0));
	}, [isTablet, dispatch]);

	return (
		<Box
			display='flex'
			flexGrow={1}
			backgroundColor='#fff'
			zIndex={3}
			height='100%'
			flexDirection='column'
			paddingInlineStart={isMobile ? '' : 'var(--sidebar-width)'}
			className={css`
				transition: 0.5s ease;
			`}
		>
			<NavPanel />
			<Wrapper />
		</Box>
	);
};

export default Preview;
