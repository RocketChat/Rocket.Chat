import React, { memo, useState, useEffect } from 'react';

import { useTabBarClose } from '../../providers/ToolboxProvider';

import { getLastUserInteractionPayload } from '../../../../../app/ui-message/client/ActionManager';

import Apps from './Apps';

const AppsWithClose = () => {
  const onClose = useTabBarClose();

  const [view, setView] = useState({});

  useEffect(() => {
    const data = getLastUserInteractionPayload();
    if (Object.entries(data).length) {
      debugger;
      setView(data.view);
    }
  }, [view]);

	return <Apps onClose={onClose} view={view} />;
};

export default memo(AppsWithClose);
