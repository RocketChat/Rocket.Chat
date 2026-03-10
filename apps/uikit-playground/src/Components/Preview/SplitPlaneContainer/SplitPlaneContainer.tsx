import './splitPlane.css';
import { useEffect, useContext } from 'react';
import SplitPane from 'react-split-pane';

import { context, previewTabsToggleAction } from '../../../Context';
import Display from '../Display';
import EditorPanel from '../Editor';

type PreviewSizeType = {
	blockSize: number;
	inlineSize: number;
};

type SplitPlaneContainerProps = {
	previewSize: Partial<PreviewSizeType>;
};

const SplitPlaneContainer = ({ previewSize }: SplitPlaneContainerProps) => {
	const {
		state: { isTablet },
		dispatch,
	} = useContext(context);

	useEffect(() => {
		dispatch(previewTabsToggleAction(0));
	}, [isTablet, dispatch]);

	const splitPaneProps = {
		defaultSize: (previewSize.inlineSize || 1) * 0.5,
		minSize: 300,
		maxSize: (previewSize.inlineSize || 1) - 350,
		allowResize: !isTablet,
	};

	return isTablet ? (
		<>
			<Display />
			<EditorPanel />
		</>
	) : (
		<SplitPane {...splitPaneProps}>
			<Display />
			<EditorPanel />
		</SplitPane>
	);
};

export default SplitPlaneContainer;
