import { Select } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context, surfaceAction } from '../../Context';
import { SurfaceOptions } from '../Preview/Display/Surface/constant';
import options from './options';

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
        // Select returns string or number; normalize to string enum value
        dispatch(surfaceAction(String(e) as unknown as SurfaceOptions));
      }}
    />
  );
};

export default SurfaceSelect;
