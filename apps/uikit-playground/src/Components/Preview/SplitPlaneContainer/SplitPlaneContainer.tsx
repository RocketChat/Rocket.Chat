import './splitPlane.css';
import { useEffect, useContext } from 'react';
import { Pane, SplitPane } from 'react-split-pane';

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

	const minSize = 300;
	const maxSize = (previewSize.inlineSize || 1) - 350;

	return isTablet ? (
		<>
			<Display />
			<EditorPanel />
		</>
	) : (
		<SplitPane resizable={!isTablet}>
			<Pane minSize={minSize} maxSize={maxSize}>
				<Display />
			</Pane>
			<Pane minSize={minSize} maxSize={maxSize}>
				<EditorPanel />
			</Pane>
		</SplitPane>
	);
};

export default SplitPlaneContainer;
