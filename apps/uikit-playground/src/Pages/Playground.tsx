import { Box } from '@rocket.chat/fuselage';
import { useContext } from 'react';

import ComponentSideBar from '../Components/ComponentSideBar';
import CreateNewScreenContainer from '../Components/CreateNewScreen/CreateNewScreenContainer';
import NavBar from '../Components/NavBar';
import Preview from '../Components/Preview';
import Templates from '../Components/Templates';
import NavMenu from '../Components/navMenu/NavMenu';
import { context } from '../Context';

const Playground = () => {
	const {
		state: { navMenuToggle },
	} = useContext(context);

	return (
		<>
			<NavBar />
			{navMenuToggle && <NavMenu />}
			<Box position='relative' width='100%' flexGrow={1}>
				<CreateNewScreenContainer />
				<Templates />
				<Box display='flex' width='100%' height='100%' flexDirection='column' overflow='hidden' bg='var(--primaryBackgroundColor)'>
					<Box width='100%' flexGrow={1} position='relative' zIndex={0}>
						<ComponentSideBar />
						<Preview />
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default Playground;
