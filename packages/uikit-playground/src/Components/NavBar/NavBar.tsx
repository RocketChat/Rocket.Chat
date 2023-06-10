import { css } from '@rocket.chat/css-in-js';
import { Box, Tile, Flex, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { FC } from 'react';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { context, updatePayloadAction } from '../../Context';
import { openCreateNewScreenAction } from '../../Context/action/openCreateNewScreenAction';
import routes from '../../Routes/Routes';
import Divider from './Divider';
import Logo from './Logo';
import RightNavBtn from './RightNavBtn';

const NabBar: FC = () => {
  const { state, dispatch } = useContext(context);
  const toast = useToastBarDispatch();
  const navigate = useNavigate();

  return (
    <Flex.Container alignItems="center">
      <Box
        position="relative"
        width={'100%'}
        height={'min(60px, 25vw)'}
        is={Tile}
        padding={0}
        zIndex={3}
        elevation={'2'}
        className={css`
          user-select: none;
        `}
      >
        <Logo />
        <Divider />
        <Box
          flexGrow={1}
          minWidth="15px"
          display={'flex'}
          justifyContent={'flex-end'}
        >
          <Box display="flex" height="100%">
            {!state?.isMobile && (
              <ButtonGroup
                pie={'20px'}
                className={css`
                  column-gap: 5px;
                `}
              >
                <Button
                  small
                  onClick={() => {
                    navigate(`/${routes.flow}`);
                  }}
                >
                  Flow
                </Button>
                <Button
                  small
                  onClick={() => {
                    dispatch(openCreateNewScreenAction(true));
                  }}
                >
                  Screens
                </Button>
                <Button
                  small
                  onClick={() => {
                    dispatch(
                      updatePayloadAction({
                        payload: [],
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
                <Button
                  small
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        state?.screens[state.activeScreen]?.payload
                      )
                    );
                    toast({
                      type: 'success',
                      message: 'Payload Copied',
                    });
                  }}
                >
                  Copy Payload
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
