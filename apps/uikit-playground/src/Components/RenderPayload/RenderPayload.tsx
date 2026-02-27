import {
  UiKitModal as uiKitModal,
  UiKitBanner as uiKitBanner,
  UiKitMessage as uiKitMessage,
  UiKitContextualBar as uiKitContextualBar,
} from '@rocket.chat/fuselage-ui-kit';

import { type ILayoutBlock } from '../../Context/initialState';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';

const RenderPayload = ({
  blocks,
  surface = SurfaceOptions.Message,
}: {
  index?: number;
  blocks: ILayoutBlock[];
  surface?: number;
}) => (
  <>
    {SurfaceOptions.Message === surface && uiKitMessage(blocks)}
    {SurfaceOptions.Banner === surface && uiKitBanner(blocks)}
    {SurfaceOptions.Modal === surface && uiKitModal(blocks)}
    {SurfaceOptions.ContextualBar === surface && uiKitContextualBar(blocks)}
  </>
);

export default RenderPayload;
