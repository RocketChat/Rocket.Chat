import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useContext, type FC } from 'react';

import SurfaceSelect from '../../SurfaceSelect';
import MenuItem from './MenuItem';
import Wrapper from './Wrapper';
import {
  context,
  templatesToggleAction,
  updatePayloadAction,
} from '../../../Context';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';

const Menu: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const {
    state: { screens, activeScreen },
    dispatch,
  } = useContext(context);

  const toast = useToastBarDispatch();

  const basicStyle = css`
    right: max(-85%, -280px);
    transition: 0.3s ease;
    box-shadow: rgb(0 0 0 / 30%) 0px 0px 15px 1px;
  `;

  const toggleStyle = isOpen
    ? css`
        transform: translateX(-100%);
      `
    : css`
        transform: translateX(0);
      `;

  return (
    <Box
      position="absolute"
      width="min(85%, 280px)"
      height="100%"
      bg="default"
      className={[basicStyle, toggleStyle]}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Wrapper>
        <Box alignSelf={'flex-start'}>
          <SurfaceSelect />
        </Box>
        <MenuItem
          name={'Templates'}
          onClick={() => dispatch(templatesToggleAction(true))}
        />
        <MenuItem
          name={'Clear Blocks'}
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
        />
        <MenuItem
          name={'Copy Payload'}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify(screens[activeScreen]?.payload)
            );
            toast({
              type: 'success',
              message: 'Payload Copied',
            });
          }}
        />
        <MenuItem name={'Send to RocketChat'} />
      </Wrapper>
    </Box>
  );
};

export default Menu;
