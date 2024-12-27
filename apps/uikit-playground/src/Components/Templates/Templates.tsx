import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Scrollable } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context, templatesToggleAction } from '../../Context';
import { templates } from '../../utils/templates';
import Container from './Container';

const Templates: FC = () => {
  const {
    state: { templatesToggle },
    dispatch,
  } = useContext(context);
  return (
    <>
      {templatesToggle && (
        <Scrollable vertical>
          <Box
            position="absolute"
            width={'100%'}
            height={'100%'}
            display="flex"
            justifyContent="center"
            alignItems="flex-start"
            bg="white"
            zIndex={100}
            overflow="auto"
            className={css`
              top: 0;
              left: 0;
            `}
          >
            <Button
              position="fixed"
              square
              className={css`
                top: 80px;
                right: 40px;
              `}
              onClick={() => dispatch(templatesToggleAction(false))}
            >
              <Icon name="cross" size="x15" />
            </Button>
            <Container templates={templates} />
          </Box>
        </Scrollable>
      )}
    </>
  );
};

export default Templates;
