import {
    Box,
    Callout,
} from '@rocket.chat/fuselage';
import { useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { GenericModal } from '@rocket.chat/ui-client';

const DeleteScheduledMessageModal = ({ 
    message, 
    onConfirm,
    onClose,
    getChannelName,
    getChannelIcon,
    getDestinationAvatar,
    formatScheduledTime
}) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
            dispatchToastMessage({ 
                type: 'success', 
                message: t('Scheduled_message_cancelled_successfully') 
            });
            onClose();
        } catch (error) {
            dispatchToastMessage({
                type: 'error',
                message: error.message || t('Failed_to_cancel_scheduled_message'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <GenericModal
            variant="danger"
            icon={'trash'}
            confirmText={t('Cancel_Message')}
            cancelText={t('Keep_Message')}
            onCancel={onClose}
            onConfirm={handleConfirm}
            confirmDisabled={isSubmitting}
            title={t('Cancel_Scheduled_Message')}
        >
            <Callout type='warning' mbs={16}>
                <Box fontScale='h4'>{t('Are_you_sure')}</Box>
                <Box>{t('This_action_cannot_be_undone')}</Box>
            </Callout>
            
            <Box marginBlockStart='x16'>
                <Box 
                    p='x12' 
                    bg='neutral-800' 
                    borderRadius='x4' 
                    fontStyle='italic'
                    color='neutral-300'
                    mbe='x4'
                >
                    {message.msg || 'No message content'}
                </Box>
                <Box marginBlockStart='x8' fontScale='c1' color='neutral-600'>
                    {formatScheduledTime(message.scheduledAt)}
                </Box>
            </Box>
        </GenericModal>
    );
};

export default DeleteScheduledMessageModal;