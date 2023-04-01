import { useState } from 'react';
import { getUserMentions, getChannelMentions, getChannel, getUser, textToMessageToken } from '../utils/messageMarkdownUtils';
import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod} from '@rocket.chat/ui-contexts';

export const useMarkdownPreview = (rid: IRoom['_id']) => {
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [md, setMd] = useState();
  const [channels, setChannels] = useState([]);
  const [mentions, setMentions] = useState([]);
  const userSpotlight = useMethod('spotlight');

  const handleViewPreview = async (text: string | undefined) => {
    setMd(textToMessageToken(text, {}));
    const channelTextArray = getChannelMentions(text)
    const channelsMentioned = channelTextArray.map((c) => getChannel(c)).filter(ch => ch !== undefined)
    setChannels(channelsMentioned);
    setMentions(getUserMentions(text));
    const mentionsText = getUserMentions(text);
    const promises = mentionsText.map((u) => getUser(u,rid,userSpotlight));
    const users = await Promise.all(promises);
    setMentions(users.filter(user => user !== undefined));
    setShowMarkdownPreview(!showMarkdownPreview);
  };

  return {
    showMarkdownPreview,
    setShowMarkdownPreview,
    handleViewPreview,
    md,
    channels,
    mentions,
  };
};
