import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import renderPayload from '../Preview/Display/RenderPayload/RenderPayload';

const UIKitWrapper = ({ id, data }) => {
  console.log(data, id);
  return <Box>{renderPayload({ index: 0, surface: 1, payload: data })}</Box>;
};

export default UIKitWrapper;
