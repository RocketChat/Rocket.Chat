import './PrototypeRender.scss';
import { Box } from '@rocket.chat/fuselage';
import RenderPayload from '../RenderPayload/RenderPayload';
import SurfaceRender from '../Preview/Display/Surface/SurfaceRender';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';
import { ILayoutBlock, idType } from '../../Context/initialState';
import { Edge } from 'reactflow';
import { css } from '@rocket.chat/css-in-js';
import { useRef, useState } from 'react';

const PrototypeRender = ({
  blocks,
  surface,
  flowEdges,
  activeActions,
  onSelectAction,
}: {
  blocks: ILayoutBlock[];
  surface: SurfaceOptions;
  flowEdges: Edge[];
  activeActions: idType[];
  onSelectAction: (id: idType) => void;
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [glowActive, setGlowActive] = useState(false);
  const actionClickHandler = (id: idType) => {
    const edge = flowEdges.find((edge) => edge.sourceHandle === id);
    if (edge) return onSelectAction(edge.target);

    clearTimeout(timerRef.current);

    setGlowActive(false);
    setTimeout(() => {
      setGlowActive(true);
    }, 0);
    timerRef.current = setTimeout(() => {
      setGlowActive(false);
    }, 1000);
  };
  return (
    <Box h="max-content" mb={'auto'} className="rc-prototype-renderer">
      <SurfaceRender type={surface}>
        {blocks.map((action, id) => (
          <Box
            key={id}
            className={css`
              cursor: pointer;
            `}
            onClick={() => actionClickHandler(action.actionId)}
          >
            <Box
              position="relative"
              w="100%"
              h="100%"
              className={css`
                pointer-events: none;
                user-select: none;
              `}
            >
              {glowActive && activeActions.includes(action.actionId) && (
                <Box className={'rc-prototype_action-glow'} />
              )}
              <RenderPayload blocks={[action]} surface={surface} />
            </Box>
          </Box>
        ))}
      </SurfaceRender>
    </Box>
  );
};

export default PrototypeRender;
