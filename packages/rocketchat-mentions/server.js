import MentionsServer from './MentionsServer';
const mention = new MentionsServer({
	// pattern:
});
RocketChat.callbacks.add('beforeSaveMessage', MentionsServer, RocketChat.callbacks.priority.HIGH, 'mentions');
