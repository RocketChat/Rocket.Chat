import { css } from '@rocket.chat/css-in-js';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { Box, Button } from '@rocket.chat/fuselage';
import { useContext, useMemo } from 'react';

import {
  context,
  templatesToggleAction,
  updatePayloadAction,
} from '../../../Context';
import RenderPayload from '../../RenderPayload/RenderPayload';
import getUniqueId from '../../../utils/getUniqueId';
import SurfaceRender from '../../Preview/Display/Surface/SurfaceRender';
import { ILayoutBlock } from '../../../Context/initialState';
import { SurfaceOptions } from '../../Preview/Display/Surface/constant';

const Payload = ({
  blocks,
  surface,
}: {
  surface: SurfaceOptions;
  blocks: LayoutBlock[];
}) => {
  const { dispatch } = useContext(context);
  const blocksWithUniqueIds: ILayoutBlock[] = useMemo(
    () =>
      blocks.map((block) => {
        return { ...block, actionId: getUniqueId() };
      }),
    [blocks]
  );
  const clickHandler = () => {
    dispatch(templatesToggleAction(false));
    dispatch(
      updatePayloadAction({
        blocks: blocksWithUniqueIds,
        changedByEditor: false,
      })
    );
  };
  return (
    <>
      <Box
        onClick={clickHandler}
        border="1px solid #e6e6e6"
        padding="4px"
        borderRadius={12}
        className={css`
          cursor: pointer;
        `}
      >
        <Box
          className={css`
            pointer-events: none;
            &hover {
              box-shadow: var(--elements-box-shadow);
            }
          `}
        >
          <SurfaceRender type={surface}>
            <RenderPayload blocks={blocksWithUniqueIds} surface={surface} />
          </SurfaceRender>
        </Box>
      </Box>
      <Button onClick={clickHandler} primary mbs={'15px'} mbe={'25px'}>
        Use This Template
      </Button>
    </>
  );
};

export default Payload;
