import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';
import React, { useContext, useState } from 'react';

import { context } from '../../Context';
import { activeScreenAction } from '../../Context/action/activeScreenAction';
import { deleteScreenAction } from '../../Context/action/deleteScreenAction';
import { duplicateScreenAction } from '../../Context/action/duplicateScreenAction';
import type { docType } from '../../Context/initialState';
import renderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import ScreenThumbnailWrapper from './ScreenThumbnailWrapper';
import Thumbnail from './Thumbnail';

const IntractButton = ({
  label,
  ...props
}: {
  label: string,
  icon?: ReactNode,
} & ComponentProps<typeof Button>) => <Button {...props}>{label}</Button>;

const ScreenThumbnail = ({
  screen,
  disableDelete,
}: {
  screen: docType,
  disableDelete: boolean,
}) => {
  const { dispatch } = useContext(context);
  const [isHover, setIsHover] = useState(false);

  const activateScreenHandler = () => {
    dispatch(activeScreenAction(screen?.id));
  };

  const duplicateScreenHandler = () => {
    dispatch(duplicateScreenAction({ id: screen?.id }));
  };

  const deleteScreenHandler = () => {
    dispatch(deleteScreenAction(screen?.id));
  };
  return (
    <ScreenThumbnailWrapper
      onMouseOver={() => setIsHover(true)}
      onFocus={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onBlur={() => setIsHover(false)}
    >
      <Thumbnail of={renderPayload({ payload: screen.payload })} />
      <Box
        w="100%"
        h="100%"
        insetBlockStart={0}
        display="flex"
        position="absolute"
        className={css`
          flex-direction: column;
          justify-content: space-evenly;
          transition: var(--animation-default);
        `}
        opacity={isHover ? 1 : 0}
      >
        <IntractButton label={'Select'} onClick={activateScreenHandler} />
        <IntractButton label={'Duplicate'} onClick={duplicateScreenHandler} />
        <IntractButton
          label={'Delete'}
          onClick={deleteScreenHandler}
          disabled={disableDelete}
        />
      </Box>
    </ScreenThumbnailWrapper>
  );
};

export default ScreenThumbnail;
