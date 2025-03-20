import { Box } from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { ChangeEvent, MouseEvent } from 'react';
import { useContext, useState } from 'react';

import ScreenThumbnailWrapper from '../ScreenThumbnail/ScreenThumbnailWrapper';
import Thumbnail from '../ScreenThumbnail/Thumbnail';
import { context, renameScreenAction } from '../../Context';
import { activeScreenAction } from '../../Context/action/activeScreenAction';
import { deleteScreenAction } from '../../Context/action/deleteScreenAction';
import { duplicateScreenAction } from '../../Context/action/duplicateScreenAction';
import renderPayload from '../RenderPayload/RenderPayload';
import { ScreenType } from '../../Context/initialState';
import EditMenu from '../ScreenThumbnail/EditMenu/EditMenu';

const ScreenThumbnail = ({
  screen,
  disableDelete,
}: {
  screen: ScreenType;
  disableDelete: boolean;
}) => {
  const { dispatch } = useContext(context);
  const [name, setName] = useState<string>(screen?.name);
  const toast = useToastBarDispatch();

  const activateScreenHandler = (e: MouseEvent) => {
    e.stopPropagation();
    dispatch(activeScreenAction(screen?.id));
  };

  const duplicateScreenHandler = () => {
    dispatch(duplicateScreenAction({ id: screen?.id }));
  };

  const onChangeNameHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const nameSaveHandler = () => {
    if (!name.trim()) {
      setName(screen.name);
      return toast({
        type: 'error',
        message: 'Cannot rename screen to empty name.',
      });
    }
    dispatch(renameScreenAction({ id: screen.id, name }));
  };

  const deleteScreenHandler = () => {
    if (disableDelete)
      return toast({
        type: 'info',
        message: 'Cannot delete last screen.',
      });
    dispatch(deleteScreenAction(screen?.id));
  };
  return (
    <Box position="relative">
      <EditMenu
        name={name}
        date={screen.date}
        onChange={onChangeNameHandler}
        onDuplicate={duplicateScreenHandler}
        onDelete={deleteScreenHandler}
        onBlur={nameSaveHandler}
        labelProps={{ fontScale: 'h5' }}
      />
      <ScreenThumbnailWrapper onClick={activateScreenHandler}>
        <Thumbnail of={renderPayload({ blocks: screen.payload.blocks })} />
      </ScreenThumbnailWrapper>
    </Box>
  );
};

export default ScreenThumbnail;
