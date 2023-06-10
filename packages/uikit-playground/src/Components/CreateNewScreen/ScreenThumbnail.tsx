import { Box, Menu } from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { MouseEvent } from 'react';
import React, { useContext } from 'react';

import ScreenThumbnailWrapper from './ScreenThumbnailWrapper';
import Thumbnail from './Thumbnail';
import { context } from '../../Context';
import { activeScreenAction } from '../../Context/action/activeScreenAction';
import { deleteScreenAction } from '../../Context/action/deleteScreenAction';
import { duplicateScreenAction } from '../../Context/action/duplicateScreenAction';
import type { docType } from '../../Context/initialState';
import renderPayload from '../Preview/Display/RenderPayload/RenderPayload';

const ScreenThumbnail = ({
  screen,
  disableDelete,
}: {
  screen: docType,
  disableDelete: boolean,
}) => {
  const { dispatch } = useContext(context);
  const toast = useToastBarDispatch();

  const activateScreenHandler = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch(activeScreenAction(screen?.id));
  };

  const duplicateScreenHandler = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch(duplicateScreenAction({ id: screen?.id }));
  };

  const deleteScreenHandler = (e: MouseEvent) => {
    e.stopPropagation();
    if (disableDelete)
      return toast({
        type: 'info',
        message: 'Cannot delete last screen.',
      });
    dispatch(deleteScreenAction(screen?.id));
  };
  return (
    <ScreenThumbnailWrapper onClick={activateScreenHandler}>
      <Thumbnail of={renderPayload({ payload: screen.payload })} />
      <Box onClick={(e) => e.stopPropagation()}>
        <Menu
          tiny
          position="absolute"
          insetBlockStart="5px"
          insetInlineEnd="5px"
          zIndex={100}
          placement="bottom-end"
          icon="cog"
          options={{
            duplicate: {
              label: <Box onClick={duplicateScreenHandler}>Duplicate</Box>,
            },
            delete: {
              label: (
                <Box onClick={deleteScreenHandler} color="danger">
                  Delete
                </Box>
              ),
              disabled: disableDelete,
            },
          }}
        />
      </Box>
    </ScreenThumbnailWrapper>
  );
};

export default ScreenThumbnail;
