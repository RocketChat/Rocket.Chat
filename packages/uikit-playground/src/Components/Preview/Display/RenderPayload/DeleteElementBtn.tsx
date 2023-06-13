/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Icon } from '@rocket.chat/fuselage';
import { useContext } from 'react';

import { context } from '../../../../Context';
import { docAction } from '../../../../Context/action';

const Display = ({ elementIndex }: { elementIndex: number }) => {
  const { state, dispatch } = useContext(context);

  const deleteElement = () => {
    const {
      doc: { payload },
    } = state;
    // @ts-ignore
    payload.splice(elementIndex, 1);
    dispatch(docAction({ payload: [...payload], changedByEditor: false }));
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
      <Icon name='cross' size='x20' />
    </div>
  );
};
export default Display;
