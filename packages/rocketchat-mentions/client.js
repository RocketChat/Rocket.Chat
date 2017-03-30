import mentions from './mentions';
const {MentionsClient} = mentions(RocketChat);
RocketChat.callbacks.add('renderMessage', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-message');
RocketChat.callbacks.add('renderMentions', MentionsClient, RocketChat.callbacks.priority.MEDIUM, 'mentions-mentions');
