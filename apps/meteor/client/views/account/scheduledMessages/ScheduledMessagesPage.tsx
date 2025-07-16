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
import { useCallback, useEffect, useState, useRef } from 'react';
import moment from 'moment';
import { useUser } from '@rocket.chat/ui-contexts';
import { imperativeModal } from '@rocket.chat/ui-client';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import EditScheduledMessageModal from './EditScheduledMessageModal';
import DeleteScheduledMessageModal from './DeleteScheduledMessageModal';

const ScheduledMessagesPage = () => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');
    const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
    const updateScheduledMessage = useEndpoint('POST', '/v1/chat.updateScheduledMessage');
    const deleteScheduledMessage = useEndpoint('POST', '/v1/chat.deleteScheduledMessage');

    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [roomsInfo, setRoomsInfo] = useState({});
    const [editModal, setEditModal] = useState({ isOpen: false, message: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, message: null });
    const menuRef = useRef(null);

    const user = useUser();

    const fetchScheduledMessages = useCallback(async () => {
        setLoading(true);
        try {
            const { messages = [] } = await getScheduledMessages({});
            setScheduledMessages(messages);
            
            const uniqueRids = [...new Set(messages.map(msg => msg.rid))];
            const roomsData = {};
            
            for (const rid of uniqueRids) {
                try {
                    const roomInfo = await getRoomInfo({ roomId: rid });
                    roomsData[rid] = roomInfo.room;
                } catch (error) {
                    console.error(`Failed to fetch room info for ${rid}:`, error);
                    if (rid === 'GENERAL') {
                        roomsData[rid] = { name: 'general', t: 'c' };
                    }
                }
            }
            
            setRoomsInfo(roomsData);
        } catch (error) {
            dispatchToastMessage({ type: 'error', message: error });
        } finally {
            setLoading(false);
        }
    }, [getScheduledMessages, getRoomInfo, dispatchToastMessage]);

    useEffect(() => {
        fetchScheduledMessages();
    }, [fetchScheduledMessages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

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

    const truncateText = (text, maxLength = 50) => {
        if (!text) return 'No message content';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const toggleMenu = (messageId) => {
        setOpenMenuId(openMenuId === messageId ? null : messageId);
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    const handleEditClick = (message) => {
    imperativeModal.open({
        component: EditScheduledMessageModal,
        props: {
            message,
            onSuccess: () => {
                fetchScheduledMessages();
                imperativeModal.close();
            },
            onClose: () => imperativeModal.close(),
            updateScheduledMessage,
            getChannelName,
            getChannelIcon,
            getDestinationAvatar
        }
    });
};

    const handleCancelClick = (message) => {
    imperativeModal.open({
        component: DeleteScheduledMessageModal,
        props: {
            message,
            onConfirm: async () => {
                await deleteScheduledMessage({
                    scheduledMessageId: message._id
                });
            },
            onClose: () => imperativeModal.close(),
            getChannelName,
            getChannelIcon,
            getDestinationAvatar,
            formatScheduledTime
        }
    });
};

    const getChannelName = (rid) => {
        const roomInfo = roomsInfo[rid];
        
        if (!roomInfo) {
            return rid === 'GENERAL' ? 'general' : rid;
        }
        
        switch (roomInfo.t) {
            case 'c':
                return roomInfo.name;
            case 'p':
                return roomInfo.name;
            case 'd':
                if (roomInfo.usernames && roomInfo.usernames.length > 0) {
                    const otherUser = roomInfo.usernames.find(username => username !== user?.username);
                    return otherUser || roomInfo.usernames[0];
                }
                return roomInfo.fname || roomInfo.name || roomInfo.username || 'Direct Message';
            default:
                return roomInfo.name || rid;
        }
    };

    const getChannelIcon = (rid) => {
        const roomInfo = roomsInfo[rid];
        
        if (!roomInfo) {
            return '#';
        }
        
        switch (roomInfo.t) {
            case 'c':
                return '#';
            case 'p':
                return '🔒';
            case 'd':
                return '@';
            default:
                return '#';
        }
    };

    const getDestinationAvatar = (rid) => {
        const roomInfo = roomsInfo[rid];

        if (!roomInfo) {
            return '/default-avatar.png';
        }

        switch (roomInfo.t) {
            case 'c':
            case 'p':
                if (rid === 'GENERAL' || roomInfo.name === 'general') {
                    return `/avatar/general`;
                }
                return roomInfo.avatar || `/avatar/${roomInfo.name}`;
            case 'd':
                if (roomInfo.usernames && roomInfo.usernames.length > 0) {
                    const otherUser = roomInfo.usernames.find(username => username !== user?.username);
                    return `/avatar/${otherUser || roomInfo.usernames[0]}`;
                }
                return '/default-user-avatar.png';
            default:
                return '/default-avatar.png';
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
                            <StatesTitle>{t('no_scheduled_messages')}</StatesTitle>
                            <StatesSubtitle>{t('no_pending_scheduled_messages')}</StatesSubtitle>
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
                                >
                                    <Box display='flex' flexDirection='row' alignItems='center' color='white' flex='1' minWidth='0'>
                                        <Avatar 
                                            size='x36' 
                                            url={getDestinationAvatar(msg.rid)}
                                            username={getChannelName(msg.rid)}
                                        />
                                        <Box mis='x12' fontScale='p2' flex='1' minWidth='0'>
                                            <Box fontWeight='700' color='neutral-500'>{getChannelName(msg.rid)}</Box>
                                            <Box 
                                                fontScale='c1' 
                                                color='neutral-400'
                                                overflow='hidden'
                                                textOverflow='ellipsis'
                                                whiteSpace='nowrap'
                                                maxWidth='100%'
                                                title={msg.msg || 'No message content'}
                                            >
                                                {truncateText(msg.msg)}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box
                                        display='flex'
                                        flexDirection='row'
                                        alignItems='center'
                                        position='relative'
                                        color='neutral-400'
                                        height='100%'
                                        justifyContent='center'
                                        flexShrink='0'
                                    >
                                        <Box fontScale='c1' mie='x12'>
                                            {formatScheduledTime(msg.scheduledAt)}
                                        </Box>
                                        <Button
                                            square
                                            small
                                            ghost
                                            onClick={() => toggleMenu(msg._id)}
                                            title={t('More_actions')}
                                        >
                                            <Icon name='kebab' size='x20' />
                                        </Button>
                                        {openMenuId === msg._id && (
                                            <Box
                                                ref={menuRef}
                                                position='absolute'
                                                top='100%'
                                                right='0'
                                                mt='x8'
                                                p='x8'
                                                display='flex'
                                                alignItems='center'
                                                justifyContent='center'
                                                bg='neutral-800'
                                                borderWidth='x1'
                                                borderStyle='solid'
                                                borderColor='neutral-700'
                                                borderRadius='x4'
                                                zIndex='10'
                                                boxShadow='0 4px 12px rgba(0, 0, 0, 0.3)'
                                                onClick={handleMenuClick}
                                            >
                                                <ButtonGroup align='end'>
                                                    <Button
                                                        square
                                                        title={t('Edit')}
                                                        color='neutral-500'
                                                        bg='none'
                                                        p='x8'
                                                        size='x28'
                                                        onClick={() => handleEditClick(msg)}
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
                                                        onClick={() => handleCancelClick(msg)}
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