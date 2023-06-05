import './splitPlane.css';
import type { FC } from 'react';
import { useEffect, useContext } from 'react';
import SplitPane from 'react-split-pane';

import { context } from '../../../Context';
import { tabsToggleAction } from '../../../Context/action';
import Display from '../Display';
import Editor from '../Editor';

type PreviewSizeType = {
  blockSize?: number;
  inlineSize?: number;
};
const SplitPlaneContainer: FC<{ PreviewSize: PreviewSizeType }> = ({
  PreviewSize,
}) => {
  const {
    state: { isTablet },
    dispatch,
  } = useContext(context);

  useEffect(() => {
    dispatch(tabsToggleAction(0));
  }, [isTablet, dispatch]);

  const splitPaneProps = {
    defaultSize: (PreviewSize.inlineSize ?? 0) * 0.5,
    minSize: 500,
    maxSize: (PreviewSize.inlineSize ?? 0) - 300,
    allowResize: !isTablet,
  };

  return isTablet ? (
    <>
      <Display />
      <Editor />
    </>
  ) : (
    <SplitPane {...splitPaneProps}>
      <Display />
      <Editor />
    </SplitPane>
  );
};

export default SplitPlaneContainer;
