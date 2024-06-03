import { Box } from '@rocket.chat/fuselage';
import ScreenThumbnailWrapper from '../../ScreenThumbnail/ScreenThumbnailWrapper';
import Thumbnail from '../../ScreenThumbnail/Thumbnail';
import RenderPayload from '../../RenderPayload/RenderPayload';
import {
  activeProjectAction,
  context,
  renameProjectAction,
} from '../../../Context';
import { ChangeEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import EditMenu from '../../ScreenThumbnail/EditMenu';
import EditableLabel from '../../ScreenThumbnail/EditableLabel/EditableLabel';
import { css } from '@rocket.chat/css-in-js';
import { deleteProjectAction } from '../../../Context/action/deleteProjectAction';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import routes from '../../../Routes/Routes';
import { ILayoutBlock } from '../../../Context/initialState';

const ProjectsThumbnail = ({
  id,
  name: _name,
  date,
  blocks,
}: {
  id: string;
  name: string;
  date: string;
  blocks: ILayoutBlock[];
}) => {
  const [name, setName] = useState<string>(_name);
  const navigate = useNavigate();
  const { dispatch } = useContext(context);
  const toast = useToastBarDispatch();
  const activeProjectHandler = () => {
    dispatch(activeProjectAction(id));
    navigate(`/${id}/${routes.project}`);
  };

  const deleteScreenHandler = () => {
    dispatch(deleteProjectAction(id));
  };

  const onChangeNameHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const nameSaveHandler = () => {
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
        onDelete={deleteScreenHandler}
        onBlur={nameSaveHandler}
        labelProps={{ fontScale: 'h5' }}
      />
      <ScreenThumbnailWrapper
        onClick={activeProjectHandler}
        width={'200px'}
        height="260px"
        padding="30px"
      >
        <Thumbnail of={RenderPayload({ blocks })} />
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
