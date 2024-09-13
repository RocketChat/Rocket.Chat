import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Scrollable } from '@rocket.chat/fuselage';
import { useOutsideClick, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useContext, useRef } from 'react';

import { context } from '../../Context';
import {
  openCreateNewScreenAction,
  createNewScreenAction,
} from '../../Context/action';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import ScreenThumbnail from './ScreenThumbnail';

const CreateNewScreenContainer = () => {
  const {
    state: { projects, screens, activeProject, openCreateNewScreen },
    dispatch,
  } = useContext(context);
  const ref = useRef(null);

  const onClosehandler = () => {
    dispatch(openCreateNewScreenAction(false));
  };
  useOutsideClick([ref], onClosehandler);

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
        <Button
          position="fixed"
          square
          tiny
          className={css`
            top: 20px;
            right: 20px;
          `}
          onClick={onClosehandler}
        >
          <Icon name="cross" size="x15" />
        </Button>
        {openCreateNewScreen && (
          <Box
            width="max-content"
            display="flex"
            className={css`
              gap: 50px;
              align-items: center;
            `}
          >
            {projects[activeProject]?.screens
              .map((id) => screens[id])
              .map((screen, i) => (
                <ScreenThumbnail
                  screen={screen}
                  key={i}
                  disableDelete={
                    projects[activeProject]?.screens.map((id) => screens[id])
                      .length <= 1
                  }
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
        )}
      </Box>
    </Scrollable>
  );
};

export default CreateNewScreenContainer;
