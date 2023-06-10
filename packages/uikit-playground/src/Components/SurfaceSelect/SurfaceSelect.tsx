import { Select } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext } from 'react';

import { context, surfaceAction } from '../../Context';
import options from './options';

const SurfaceSelect: FC = () => {
  const {
    state: { surface },
    dispatch,
  } = useContext(context);
  return (
    <Select
      options={options}
      value={`${surface}`}
      placeholder={'Surface'}
      onChange={(e) => {
        dispatch(surfaceAction(parseInt(e)));
      }}
    />
  );
};

export default SurfaceSelect;
