import { SurfaceOptions } from '../../Components/Preview/Display/Surface/constant';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type {
  actionPreviewType,
  initialStateType,
} from '../../Context/initialState';
import container from './container';

const generateActionPreview = ({
  type,
  data,
  surface,
  payload,
  user,
}: {
  type: string;
  data: actionPreviewType;
  surface: SurfaceOptions;
  payload: readonly LayoutBlock[];
  user: initialStateType['user'];
}) => {
  const actionPreview: actionPreviewType = {
    type,
    user,
    api_app_id: '',
    token: '',
    container: container[surface || SurfaceOptions.Message],
    trigger_id: '',
    team: null,
    enterprise: null,
    is_enterprise_install: false,
    response_url: '',
    ...data,
  };
  if (type === 'View Submission') {
    actionPreview.view = payload;
  }
  return actionPreview;
};

export default generateActionPreview;
