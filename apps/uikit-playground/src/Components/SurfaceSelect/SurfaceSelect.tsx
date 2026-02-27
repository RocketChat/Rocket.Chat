import { Select } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import options from './options';
import { context, surfaceAction } from '../../Context';

const SurfaceSelect: FC = () => {
  const {
    state: { screens, activeScreen },
    dispatch,
  } = useContext(context);
  return (
    <Select
      options={options}
      value={`${screens[activeScreen].payload.surface}`}
      placeholder="Surface"
      onChange={(e) => {
        dispatch(
          surfaceAction(typeof e === 'string' ? parseInt(e) : Number(e)),
        );
      }}
    />
  );
};

export default SurfaceSelect;
