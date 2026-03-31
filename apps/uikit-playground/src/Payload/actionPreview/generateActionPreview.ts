import { SurfaceOptions } from '../../Components/Preview/Display/Surface/constant';
import type {
  ILayoutBlock,
  actionPreviewType,
  initialStateType,
} from '../../Context/initialState';
import container from './container';

const generateActionPreview = ({
  type,
  data,
  surface,
  blocks,
  user,
}: {
  type: string;
  data: actionPreviewType;
  surface: SurfaceOptions;
  blocks: ILayoutBlock[];
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
    actionPreview.view = blocks;
  }
  return actionPreview;
};

export default generateActionPreview;
