import { useCallback } from 'react';

import { getFormattingButtons, FormattingButton } from '../../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { useReactiveValue } from '../../../../../../../hooks/useReactiveValue';

export const useRoomComposerFormattingActions = (): FormattingButton[] => useReactiveValue(useCallback(() => getFormattingButtons(), []));
