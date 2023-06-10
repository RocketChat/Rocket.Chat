import { useContext } from 'react';

import { context } from '../../Context';
import type { actionPreviewType } from '../../Context/initialState';
import container from './container';

const generateActionPreview = (type: string, data: actionPreviewType) => {
  const {
    state: { user, surface, screens, activeScreen },
  } = useContext(context);

  const actionPreview: actionPreviewType = {
    type,
    user,
    api_app_id: '',
    token: '',
    container: container[surface - 1],
    trigger_id: '',
    team: null,
    enterprise: null,
    is_enterprise_install: false,
    response_url: '',
    ...data,
  };
  if (type === 'View Submission') {
    actionPreview.view = screens[activeScreen].payload;
  }
  return actionPreview;
};

export default generateActionPreview;
