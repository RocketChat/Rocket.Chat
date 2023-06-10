/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Icon } from '@rocket.chat/fuselage';
import React, { useContext } from 'react';

import { context, updatePayloadAction } from '../../../../Context';

const Display = ({ elementIndex }: { elementIndex: number }) => {
  const { state, dispatch } = useContext(context);

  const deleteElement = () => {
    const { screens, activeScreen } = state;
    // @ts-ignore
    const payload = [...screens[activeScreen].payload];
    payload.splice(elementIndex, 1);
    dispatch(
      updatePayloadAction({ payload: [...payload], changedByEditor: false })
    );
  };
  return (
    <div
      style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        top: '6px',
        right: '6px',
        visibility: 'hidden',
        cursor: 'pointer',
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: '4px',
        border: 'var(--elements-border)',
        display: 'grid',
        placeItems: 'center',
      }}
      className={'closeBtn'}
      onClick={deleteElement}
    >
      <Icon name="cross" size="x20" />
    </div>
  );
};
export default Display;
