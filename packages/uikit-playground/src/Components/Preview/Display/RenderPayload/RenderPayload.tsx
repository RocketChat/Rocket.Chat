import {
  UiKitModal as uiKitModal,
  UiKitBanner as uiKitBanner,
  UiKitMessage as uiKitMessage,
  UiKitContextualBar as uiKitContextualBar,
} from '@rocket.chat/fuselage-ui-kit';

import { SurfaceOptions } from '../Surface/constant';
import { ILayoutBlock } from '../../../../Context/initialState';

const RenderPayload = ({
  payload,
  surface = 1,
}: {
  index?: number;
  payload: ILayoutBlock[];
  surface?: number;
}) => (
  <>
    {SurfaceOptions.Message === surface && uiKitMessage(payload)}
    {SurfaceOptions.Banner === surface && uiKitBanner(payload)}
    {SurfaceOptions.Modal === surface && uiKitModal(payload)}
    {SurfaceOptions.ContextualBar === surface && uiKitContextualBar(payload)}
  </>
);

export default RenderPayload;
