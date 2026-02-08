import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEffect, useContext, useCallback, useMemo } from 'react';

import { updatePayloadAction, context } from '../../Context';
import useCodeMirror from '../../hooks/useCodeMirror';
import intendCode from '../../utils/intendCode';
import { IPayload } from '../../Context/initialState';
import useFormatCodeMirrorValue from '../../hooks/useFormatCodeMirrorValue';

type CodeMirrorProps = {
	extensions?: Extension[];
};

const BlockEditor = ({ extensions }: CodeMirrorProps) => {
	const {
		state: { screens, activeScreen },
		dispatch,
	} = useContext(context);

	// extract active screen data (granular dependency pattern)
	const activeScreenData = screens[activeScreen];
	const payload = activeScreenData?.payload;

	const intendedPayload = useMemo(
		() => intendCode(payload),
		[payload?.blocks, payload?.surface],
	);

	const { editor, changes, setValue } = useCodeMirror(
		extensions,
		intendedPayload,
	);

	const debounceValue = useDebouncedValue(changes, 1500);

	// memoized callback (fixes recreated callback issue)
	const handleFormatValue = useCallback(
		(
			parsedCode: IPayload,
			prettifiedCode: { formatted: string; cursorOffset: number },
		) => {
			dispatch(
				updatePayloadAction({
					blocks: parsedCode.blocks,
					surface: parsedCode.surface,
				}),
			);

			setValue(prettifiedCode.formatted, {
				cursor: prettifiedCode.cursorOffset,
			});
		},
		[dispatch, setValue],
	);

	useFormatCodeMirrorValue(handleFormatValue, debounceValue);

	// sync editor when payload changes externally
	useEffect(() => {
		if (!activeScreenData?.changedByEditor) {
			setValue(intendedPayload, {});
		}
	}, [
		activeScreenData?.changedByEditor,
		payload?.blocks,
		payload?.surface,
		setValue,
		intendedPayload,
	]);

	// sync editor on screen change
	useEffect(() => {
		setValue(intendedPayload, {});
	}, [activeScreen, intendedPayload, setValue]);

	return <Box display="grid" height="100%" width="100%" ref={editor} />;
};

export default BlockEditor;
