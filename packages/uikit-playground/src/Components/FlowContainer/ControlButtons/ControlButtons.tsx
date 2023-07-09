import { Icon } from '@rocket.chat/fuselage';
import { useNavigate, useParams } from 'react-router-dom';
import { Controls, ControlButton } from 'reactflow';
import routes from '../../../Routes/Routes';

const ControlButtons = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  return (
    <Controls>
      <ControlButton
        onClick={() => navigate(`/${projectId}/${routes.project}`)}
      >
        <Icon name="home" size={'x16'} />
      </ControlButton>
      <ControlButton>
        <Icon name="play-unfilled" size={'x16'} />
      </ControlButton>
    </Controls>
  );
};

export default ControlButtons;
