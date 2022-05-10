import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { AutoTranslate } from '../../../../../app/autotranslate/client/lib/autotranslate';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const useAutotranslateLanguage = (rid: IRoom['_id']): string | undefined =>
	useReactiveValue(useCallback(() => AutoTranslate.getLanguage(rid), [rid]));
