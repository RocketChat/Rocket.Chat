import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import TimestampPicker from '../../../../../../components/message/TimestampPicker';
import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';

export const useTimestampAction = (composer: ComposerAPI | undefined, disabled: boolean): (() => GenericMenuItemProps) => {
    const setModal = useSetModal();

    const handleInsertTimestamp = useMutableCallback((markup: string) => {
        composer?.insertText(markup);
        setModal(null);
    });

    const handleClick = useMutableCallback(() => {
        if (!composer) {
            return;
        }

        const handleClose = (): void => {
            setModal(null);
        };

        setModal(
            <TimestampPicker
                onClose={handleClose}
                onInsert={handleInsertTimestamp}
                initialDate={new Date()}
            />,
        );
    });

    return useMutableCallback((): GenericMenuItemProps => ({
        id: 'timestamp',
        icon: 'clock',
        content: 'Insert_Timestamp',
        onClick: handleClick,
        disabled,
    }));
};


