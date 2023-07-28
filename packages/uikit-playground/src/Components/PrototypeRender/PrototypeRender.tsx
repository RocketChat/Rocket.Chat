import './PrototypeRender.scss';
import { Box } from '@rocket.chat/fuselage';
import RenderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import SurfaceRender from '../Preview/Display/Surface/SurfaceRender';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';
import { ILayoutBlock, idType } from '../../Context/initialState';
import { Edge } from 'reactflow';
import { css } from '@rocket.chat/css-in-js';
import { useState } from 'react';

const PrototypeRender = ({
  payload,
  surface,
  flowEdges,
  activeActions,
  onSelectAction,
}: {
  payload: ILayoutBlock[];
  surface: SurfaceOptions;
  flowEdges: Edge[];
  activeActions: idType[];
  onSelectAction: (id: idType) => void;
}) => {
  const [glowActive, setGlowActive] = useState(false);
  const actionClickHandler = (id: idType) => {
    const edge = flowEdges.find((edge) => edge.sourceHandle === id);
    if (edge) return onSelectAction(edge.target);

    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 1000);
  };
  return (
    <Box w="40%" h="max-content" mb={'auto'} className="rc-prototype-renderer">
      <SurfaceRender type={surface}>
        {payload.map((action, id) => (
          <Box key={id} onClick={() => actionClickHandler(action.actionId)}>
            <Box
              className={`${
                activeActions.includes(action.actionId)
                  ? 'rc-prototype_action' +
                    (glowActive ? ' rc-prototype_action-glow' : '')
                  : ''
              }`}
            >
              <Box
                w="100%"
                h="100%"
                className={css`
                  pointer-events: none;
                  user-select: none;
                `}
              >
                <RenderPayload payload={[action]} surface={surface} />
              </Box>
            </Box>
          </Box>
        ))}
      </SurfaceRender>
    </Box>
  );
};

export default PrototypeRender;
