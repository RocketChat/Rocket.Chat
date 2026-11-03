import { css } from '@rocket.chat/css-in-js';
import { Box, Tile, FlexContainer, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import RightNavBtn from './RightNavBtn';
import { context, updatePayloadAction } from '../../Context';
import { openCreateNewScreenAction } from '../../Context/action/openCreateNewScreenAction';
import routes from '../../Routes/Routes';

const NabBar = () => {
	const {
		state: { isMobile, screens, activeScreen },
		dispatch,
	} = useContext(context);
	const toast = useToastBarDispatch();
	const navigate = useNavigate();

	return (
		<FlexContainer alignItems='center'>
			<Box
				position='relative'
				width='100%'
				height='var(--navbar-height)'
				is={Tile}
				padding={0}
				zIndex={3}
				elevation='2'
				className={css`
					user-select: none;
				`}
			>
				<Box display='inline-flex' alignItems='center' gap='12px' paddingInlineStart='20px'>
					<Button variant='primary' onClick={() => navigate(routes.home)} size='small' square>
						<Icon name='home' size='x24' />
					</Button>
					{!isMobile && (
						<Button
							size='small'
							variant='success'
							onClick={() => {
								dispatch(openCreateNewScreenAction(true));
							}}
						>
							Screens
						</Button>
					)}
				</Box>
				<Box flexGrow={1} minWidth='15px' display='flex' justifyContent='flex-end'>
					<Box display='flex' height='100%'>
						{!isMobile && (
							<ButtonGroup>
								<Button
									variant='secondary-success'
									size='small'
									onClick={async () => {
										await navigator.clipboard.writeText(JSON.stringify(screens[activeScreen]?.payload));
										toast({
											type: 'success',
											message: 'Payload Copied',
										});
									}}
								>
									Copy Payload
								</Button>
								<Button
									size='small'
									variant='danger'
									onClick={() => {
										dispatch(
											updatePayloadAction({
												blocks: [],
												changedByEditor: false,
											}),
										);
										toast({
											type: 'success',
											message: 'All Blocks Cleared',
										});
									}}
								>
									Clear Blocks
								</Button>
							</ButtonGroup>
						)}
					</Box>
				</Box>
				<RightNavBtn />
			</Box>
		</FlexContainer>
	);
};

export default NabBar;
