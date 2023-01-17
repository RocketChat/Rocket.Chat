import React from 'react';
import RoomTags from '../RoomTags';
import MarkdownText from '../../../components/MarkdownText';
import { useFormatDate } from '/client/hooks/useFormatDate';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { Avatar, Box, Flex, TableCell, TableRow, Icon } from "@rocket.chat/fuselage";
import type { IRoom } from "@rocket.chat/core-typings"

type ChannelsTableRowProps = {
  channel: IRoom,
  onClick: (name: IRoom['name']) => (e: React.KeyboardEvent | React.MouseEvent) => void;
  mediaQuery: boolean
}

const ChannelsTableRow = ({
  channel,
  onClick,
  mediaQuery,
}: ChannelsTableRowProps) => {
  const formatDate = useFormatDate();
  const { _id, ts, t, name, usersCount, lastMessage, fname, topic } = channel;
  
  const avatarUrl = roomCoordinator.getRoomDirectives(t)?.getAvatarPath(channel);

  return (
    <TableRow key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
      <TableCell>
        <Flex.Container>
          <Box>
            <Flex.Item>{name && <Avatar size='x40' title={fname || name} url={avatarUrl || ""} />}</Flex.Item>
            <Box withTruncatedText mi="x8">
              <Box display='flex' alignItems='center'>
                <Icon name={roomCoordinator.getIcon(channel) || "hashtag"} color='hint' />
                {' '}
                <Box fontScale='p2m' mi='x4'>
                  {fname || name}
                </Box>
                <RoomTags room={channel} />
              </Box>
              {topic && (
                <MarkdownText
                  variant='inlineWithoutBreaks'
                  fontScale='p2'
                  color='hint'
                  content={topic}
                />
              )}
            </Box>
          </Box>
        </Flex.Container>
      </TableCell>
      <TableCell fontScale='p2' color='hint' withTruncatedText>
        {usersCount}
      </TableCell>
      {mediaQuery && (
        <TableCell fontScale='p2' color='hint' withTruncatedText>
          {ts && formatDate(ts)}
        </TableCell>
      )}
      {mediaQuery && (
        <TableCell fontScale='p2' color='hint' withTruncatedText>
          {lastMessage && formatDate(lastMessage.ts)}
        </TableCell>
      )}
      {mediaQuery && (
        <TableCell fontScale='p2' color='hint' withTruncatedText>
          {""}
        </TableCell>
      )}
    </TableRow>
  )
};

export default ChannelsTableRow;