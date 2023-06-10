import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Scrollable } from '@rocket.chat/fuselage';
import { useOutsideClick, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import React, { useContext, useRef } from 'react';

import { context } from '../../Context';
import {
  openCreateNewScreenAction,
  createNewScreenAction,
} from '../../Context/action';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import ScreenThumbnail from './ScreenThumbnail';

const CreateNewScreenContainer = () => {
  const {
    state: { screens, openCreateNewScreen },
    dispatch,
  } = useContext(context);
  const ref = useRef(null);
  useOutsideClick([ref], () => dispatch(openCreateNewScreenAction(false)));

  const scrollRef = useHorizontalScroll();

  const mergedRef = useMergedRefs(scrollRef, ref);
  const createNewScreenhandler = () => {
    dispatch(createNewScreenAction());
  };

  return (
    <Scrollable horizontal>
      <Box
        ref={mergedRef}
        w="100%"
        height="250px"
        borderBlockEnd="var(--default-border)"
        position="fixed"
        pi="40px"
        className={css`
          top: -255px;
          left: 0;
          z-index: 10;
          align-items: center;
          display: flex;
          justify-content: center;
          background-color: var(--primaryBackgroundColor);
          box-shadow: var(--elements-box-shadow);
          transform: translateY(${openCreateNewScreen ? '255px' : '0px'});
          transition: var(--animation-default);
        `}
      >
        <Box
          width="max-content"
          display="flex"
          className={css`
            gap: 50px;
            align-items: center;
          `}
        >
          {Object.values(screens).map((screen, i) => (
            <ScreenThumbnail
              screen={screen}
              key={i}
              disableDelete={Object.keys(screens).length <= 1}
            />
          ))}
          <Icon
            onClick={createNewScreenhandler}
            size="60px"
            height={'60px'}
            name={'plus'}
            className={css`
              cursor: pointer;
              transition: var(--animation-default);
              &:hover {
                scale: 1.1;
                transition: var(--animation-default);
              }
            `}
          />
        </Box>
      </Box>
    </Scrollable>
  );
};

export default CreateNewScreenContainer;
