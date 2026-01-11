import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Throbber, Icon } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

type MessageHistoryModalProps = {
    messageId: string;
    onClose: () => void;
};

export const MessageHistoryModal = ({ messageId, onClose }: MessageHistoryModalProps): ReactElement => {
    const getMessageHistory = useEndpoint('GET', '/v1/chat.getMessageHistory');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['messageEditHistory', messageId],
        queryFn: async () => {
            const result = await getMessageHistory({ messageId });
            return result;
        },
        staleTime: 0,
        cacheTime: 0,
    });

    const messages = data?.messages || [];
    const hasEditHistory = messages.length > 1;

    return (
        <GenericModal
            variant='info'
            title='Message Edit History'
            onClose={onClose}
            onConfirm={onClose}
            confirmText='Close'
            style={{
                position: 'fixed',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                left: 'auto',
                margin: 0,
            }}
        >
            <Box minHeight='200px' maxHeight='60vh' overflow='auto' p={16}>
                {isLoading && (
                    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='200px'>
                        <Throbber size='x32' />
                        <Box fontScale='p2' color='hint' mt={8}>Loading history...</Box>
                    </Box>
                )}
                
                {isError && (
                    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='200px' p={16}>
                        <Icon name='circle-exclamation' size='x40' color='danger' />
                        <Box fontScale='p2' color='default' mt={8}>
                            {error instanceof Error ? error.message : 'Error loading history'}
                        </Box>
                    </Box>
                )}
                
                {!isLoading && !isError && messages.length === 0 && (
                    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='200px' p={16}>
                        <Icon name='magnifier' size='x40' color='annotation' />
                        <Box fontScale='p2' color='hint' mt={8}>No message data found</Box>
                    </Box>
                )}
                
                {!isLoading && !isError && messages.length === 1 && (
                    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='200px' p={24}>
                        <Box fontScale='p2' color='default' textAlign='center' mb={16}>
                            This message hasn't been edited yet
                        </Box>
                        <Box width='100%' maxWidth='400px' p={16} bg='surface-light' borderRadius='medium' borderWidth='x2' borderColor='stroke-extra-light'>
                            <Box fontScale='micro' color='annotation' mb={8} fontWeight='bold' style={{ textTransform: 'uppercase' }}>
                                Original Content
                            </Box>
                            <Box fontScale='p2' color='default'>
                                {messages[0]?.msg || 'No content'}
                            </Box>
                        </Box>
                    </Box>
                )}
                
                {!isLoading && !isError && hasEditHistory && (
                    <Box>
                        <Box fontScale='p2' color='hint' mb={16} display='flex' alignItems='center'>
                            <Icon name='history' size='x16' mie='x8'/> {messages.length} total versions
                        </Box>
                        {messages.map((msg: IMessage, index: number) => {
                            const isCurrentVersion = index === messages.length - 1;
                            const versionNumber = index + 1;
                            
                            return (
                                <Box 
                                    key={msg._id} 
                                    mb={12} 
                                    p={12} 
                                    borderWidth='x2' 
                                    // Current version gets a subtle success (green) border, others stay neutral
                                    borderColor={isCurrentVersion ? 'success-light' : 'stroke-extra-light'} 
                                    borderRadius='medium' 
                                    // Subtle background shift for the current version
                                    bg={isCurrentVersion ? 'success-extra-light' : 'surface-tint'}
                                >
                                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={8}>
                                        <Box fontScale='p2m' color={isCurrentVersion ? 'success-dark' : 'default'}>
                                            {isCurrentVersion ? '✅ Current Version' : `Version ${versionNumber}`}
                                        </Box>
                                        <Box fontScale='micro' color='annotation'>
                                            {msg.editedAt ? new Date(msg.editedAt).toLocaleString() : new Date(msg.ts).toLocaleString()}
                                        </Box>
                                    </Box>
                                    
                                    <Box fontScale='p2' p={8} bg='surface-light' borderRadius='small' color='default' border='x1' borderColor='stroke-extra-light'>
                                        {msg.msg}
                                    </Box>

                                    {msg.u && (
                                        <Box fontScale='micro' color='hint' mt={8} display='flex' alignItems='center'>
                                            <Icon name='user' size='x12' mie='x4'/> {msg.u.username}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </GenericModal>
    );
};