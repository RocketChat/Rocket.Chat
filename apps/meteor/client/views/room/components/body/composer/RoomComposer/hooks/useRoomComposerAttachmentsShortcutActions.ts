import { useCallback } from 'react';

import { messageBox, MessageBoxAction } from '../../../../../../../../app/ui-utils/client/lib/messageBox';
import { useReactiveValue } from '../../../../../../../hooks/useReactiveValue';

export const useRoomComposerAttachmentsShortcutActions = (): Record<string, MessageBoxAction[]> =>
	useReactiveValue(useCallback(() => messageBox.actions.get(), []));
