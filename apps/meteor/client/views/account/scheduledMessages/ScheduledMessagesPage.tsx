import {
    Box,
    Margins,
    States,
    StatesIcon,
    StatesTitle,
    StatesSubtitle,
    Button,
    ButtonGroup,
    Avatar,
    Icon,
} from '@rocket.chat/fuselage';
import {
    useEndpoint,
    useTranslation,
    useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { useUser } from '@rocket.chat/ui-contexts';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

const ScheduledMessagesPage = () => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');

    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState(null);

     const user = useUser();

    const fetchScheduledMessages = useCallback(async () => {
        setLoading(true);
        try {
            const { messages = [] } = await getScheduledMessages({});
            setScheduledMessages(messages);
        } catch (error) {
            dispatchToastMessage({ type: 'error', message: error });
        } finally {
            setLoading(false);
        }
    }, [getScheduledMessages, dispatchToastMessage]);

    useEffect(() => {
        fetchScheduledMessages();
    }, [fetchScheduledMessages]);

    const formatScheduledTime = (scheduledAt) => {
        const scheduledDate = moment(scheduledAt);
        const today = moment().startOf('day');
        const tomorrow = moment().add(1, 'day').startOf('day');

        if (scheduledDate.isSame(today, 'day')) {
            return `Send today at ${scheduledDate.format('h:mm A')}`;
        } else if (scheduledDate.isSame(tomorrow, 'day')) {
            return `Send tomorrow at ${scheduledDate.format('h:mm A')}`;
        } else {
            return `Send on ${scheduledDate.format('DD/MM/YYYY, h:mm A')}`;
        }
    };

    return (
        <Page>
            <PageHeader title={t('Scheduled_Messages')} />
            <PageScrollableContentWithShadow>
                <Box maxWidth='100%' w='full' alignSelf='center'>
                    {loading ? (
                        <States>
                            <StatesIcon name='hourglass' />
                            <StatesTitle>{t('Loading')}</StatesTitle>
                        </States>
                    ) : scheduledMessages.length === 0 ? (
                        <States>
                            <StatesIcon name='calendar' />
                            <StatesTitle>{t('No_Scheduled_Messages')}</StatesTitle>
                            <StatesSubtitle>{t('You_have_no_pending_scheduled_messages')}</StatesSubtitle>
                        </States>
                    ) : (
                        <Margins block='x16'>
                            {scheduledMessages.map((msg) => (
                                <Box
                                    key={msg._id}
                                    w='full'
                                    p='x16'
                                    bg='neutral-800'
                                    borderRadius='x4'
                                    display='flex'
                                    flexDirection='row'
                                    justifyContent='space-between'
                                    alignItems='center'
                                    onMouseEnter={() => setHoveredId(msg._id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <Box display='flex' flexDirection='row' alignItems='center' color='white'>
                                         <Avatar 
                                            size='x36' 
                                            url={user?.avatarETag ? `/avatar/${user.username}?etag=${user.avatarETag}` : undefined}
                                            username={user?.username}
                                        />
                                        <Box mis='x12' fontScale='p2'>
                                            <Box fontWeight='700' color='neutral-500'>{msg.u?.username || 'Unknown User'}</Box>
                                            <Box fontScale='c1' color='neutral-400'>
                                                {msg.msg || 'No message content'}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box
                                        display='flex'
                                        flexDirection='column'
                                        alignItems='flex-end'
                                        position='relative'
                                        color='neutral-400'
                                        height='100%'
                                        justifyContent='center' // Add this to center the content
                                    >
                                        <Box fontScale='c1'>
                                            {formatScheduledTime(msg.scheduledAt)}
                                        </Box>
                                        {hoveredId === msg._id && (
                                            <Box
                                                position='absolute'
                                                p='x8'
                                                display='flex'
                                                alignItems='center'
                                                justifyContent='center'
                                                bg='neutral-800'
                                                borderWidth='x1'
                                                borderStyle='solid'
                                                borderColor='neutral-700'
                                                borderRadius='x4'
                                                zIndex='2'
                                            >
                                                <ButtonGroup align='end'>
                                                    <Button
                                                        square
                                                        title={t('Edit')}
                                                        color='neutral-500'
                                                        bg='none'
                                                        p='x8'
                                                        size='x28'
                                                    >
                                                        <Icon name='pencil' size='x20' />
                                                    </Button>
                                                    <Button
                                                        square
                                                        title={t('Cancel')}
                                                        color='neutral-500'
                                                        bg='none'
                                                        p='x8'
                                                        size='x28'
                                                    >
                                                        <Icon name='trash' size='x20' />
                                                    </Button>
                                                </ButtonGroup>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </Margins>
                    )}
                </Box>
            </PageScrollableContentWithShadow>
        </Page>
    );
};

export default ScheduledMessagesPage;