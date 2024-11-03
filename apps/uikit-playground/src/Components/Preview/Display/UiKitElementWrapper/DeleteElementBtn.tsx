import './UiKitElementWrapper.scss';
import { Icon } from '@rocket.chat/fuselage';
import { useContext } from 'react';

import { context, updatePayloadAction } from '../../../../Context';

const Display = ({ elementIndex }: { elementIndex: number }) => {
  const { state, dispatch } = useContext(context);

  const deleteElement = () => {
    const { screens, activeScreen } = state;
    const blocks = [...screens[activeScreen].payload.blocks];
    blocks.splice(elementIndex, 1);
    dispatch(
      updatePayloadAction({ blocks: [...blocks], changedByEditor: false })
    );
  };
  return (
    <div className={'uikit-element-delete-btn'} onClick={deleteElement}>
      <Icon name="cross" size="x20" />
    </div>
  );
};
export default Display;
