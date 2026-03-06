import json5 from 'json5';
import { useEffect } from 'react';

import type { ICodeMirrorChanges } from './useCodeMirror';
import type { IPayload } from '../Context/initialState';
import codePrettier from '../utils/codePrettier';

// Todo: needs to make it more strict
function isILayoutblock(obj: object): obj is IPayload {
	return obj && typeof obj === 'object' && 'surface' in obj && 'blocks' in obj;
}

const useFormatCodeMirrorValue = (
	callback: (parsedCode: IPayload, prettierCode: Awaited<ReturnType<typeof codePrettier>>) => void,
	changes: ICodeMirrorChanges,
) => {
	useEffect(() => {
		if (changes?.isDispatch) return;

		try {
			const parsedCode = json5.parse(changes.value);
			if (!isILayoutblock(parsedCode)) throw new Error('Please enter a valid LayoutBlock');
			void codePrettier(changes.value, changes.cursor || 0).then((prettierCode) => {
				callback(parsedCode, prettierCode);
			});
		} catch (e) {
			// do nothing
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [changes]);
};

export default useFormatCodeMirrorValue;
