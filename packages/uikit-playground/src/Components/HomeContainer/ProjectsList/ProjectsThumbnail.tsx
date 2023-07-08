import { Box } from '@rocket.chat/fuselage';
import ScreenThumbnailWrapper from '../../ScreenThumbnail/ScreenThumbnailWrapper';
import Thumbnail from '../../ScreenThumbnail/Thumbnail';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import RenderPayload from '../../Preview/Display/RenderPayload/RenderPayload';
import {
  context,
  duplicateProjectAction,
  renameProjectAction,
} from '../../../Context';
import { ChangeEvent, useContext, useState } from 'react';
import { activeProjectAction } from '../../../Context/action/activeProjectAction';
import { useNavigate } from 'react-router-dom';
import routes from '../../../Routes/Routes';
import { formatDate } from '../../../utils/formatDate';
import EditMenu from '../../ScreenThumbnail/EditMenu';
import EditableLabel from '../../ScreenThumbnail/EditableLabel/EditableLabel';
import { css } from '@rocket.chat/css-in-js';
import { deleteProjectAction } from '../../../Context/action/deleteProjectAction';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';

const ProjectsThumbnail = ({
  id,
  name: _name,
  date,
  payload,
}: {
  id: string;
  name: string;
  date: string;
  payload: readonly LayoutBlock[];
}) => {
  const [name, setName] = useState<string>(_name);
  const navigate = useNavigate();
  const { dispatch } = useContext(context);
  const toast = useToastBarDispatch();
  const activeProjectHandler = () => {
    dispatch(activeProjectAction(id));
    navigate(`/${id}`);
  };

  const duplicateScreenHandler = () => {
    dispatch(duplicateProjectAction({ id }));
  };
  const deleteScreenHandler = () => {
    dispatch(deleteProjectAction(id));
  };

  const onChangeNameHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const nameSaveHandler = () => {
    window.console.log('nameSaveHandler');
    if (!name.trim()) {
      setName(_name);
      return toast({
        type: 'error',
        message: 'Cannot rename project to empty name.',
      });
    }
    dispatch(renameProjectAction({ id, name }));
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      className={css`
        gap: 5px;
      `}
      position="relative"
    >
      <EditMenu
        name={name}
        date={date}
        onChange={onChangeNameHandler}
        onDuplicate={duplicateScreenHandler}
        onDelete={deleteScreenHandler}
        onBlur={nameSaveHandler}
        labelProps={{ fontScale: 'h5' }}
      />
      <ScreenThumbnailWrapper
        onClick={activeProjectHandler}
        width={'200px'}
        height="260px"
      >
        <Thumbnail of={RenderPayload({ payload })} />
        <Box onClick={(e) => e.stopPropagation()}></Box>
      </ScreenThumbnailWrapper>
      <EditableLabel
        value={name}
        onChange={onChangeNameHandler}
        fontScale="h5"
        onBlur={nameSaveHandler}
      />
      <Box withTruncatedText fontScale="p2">
        {formatDate(date)}
      </Box>
    </Box>
  );
};

export default ProjectsThumbnail;
