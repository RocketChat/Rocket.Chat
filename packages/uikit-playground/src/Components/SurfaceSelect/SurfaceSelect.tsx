import { Select } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext, useMemo } from 'react';

import { context, surfaceAction } from '../../Context';
import options from './options';

const SurfaceSelect: FC = () => {
  const {
    state: { screens, activeScreen },
    dispatch,
  } = useContext(context);

  // temp fix for the placeholder
  const placeHolder = useMemo(() => {
    try {
      return options[screens[activeScreen].payload.surface - 1][1];
    } catch (e) {
      return 'Select Surface';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens[activeScreen].payload.surface]);

  // Fuselage Select component is not working properly with the value prop
  return (
    <Select
      options={options}
      value={screens[activeScreen].payload.surface}
      placeholder={placeHolder}
      onChange={(e) => {
        dispatch(surfaceAction(parseInt(`${e}`)));
      }}
    />
  );
};

export default SurfaceSelect;
