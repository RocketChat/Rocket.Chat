import { css } from '@rocket.chat/css-in-js';
import {
  Box,
  Tile,
  Flex,
  ButtonGroup,
  Button,
  Icon,
} from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { FC } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { context, updatePayloadAction } from '../../Context';
import { openCreateNewScreenAction } from '../../Context/action/openCreateNewScreenAction';
import routes from '../../Routes/Routes';
import RightNavBtn from './RightNavBtn';

const NabBar: FC = () => {
  const {
    state: { isMobile, screens, activeScreen },
    dispatch,
  } = useContext(context);
  const toast = useToastBarDispatch();
  const navigate = useNavigate();

  return (
    <Flex.Container alignItems="center">
      <Box
        position="relative"
        width={'100%'}
        height={'var(--navbar-height)'}
        is={Tile}
        padding={0}
        zIndex={3}
        elevation={'2'}
        className={css`
          user-select: none;
        `}
      >
        <Button
          primary
          onClick={() => navigate(routes.home)}
          mis="20px"
          small
          square
        >
          <Icon name="home" size="x24" />
        </Button>
        {!isMobile && (
          <Button
            mis="12px"
            small
            success
            onClick={() => {
              dispatch(openCreateNewScreenAction(true));
            }}
          >
            Screens
          </Button>
        )}
        <Box
          flexGrow={1}
          minWidth="15px"
          display={'flex'}
          justifyContent={'flex-end'}
        >
          <Box display="flex" height="100%">
            {!isMobile && (
              <ButtonGroup>
                <Button
                  secondary
                  success
                  small
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(screens[activeScreen]?.payload)
                    );
                    toast({
                      type: 'success',
                      message: 'Payload Copied',
                    });
                  }}
                >
                  Copy Payload
                </Button>
                <Button
                  small
                  danger
                  onClick={() => {
                    dispatch(
                      updatePayloadAction({
                        blocks: [],
                        changedByEditor: false,
                      })
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
    </Flex.Container>
  );
};

export default NabBar;
