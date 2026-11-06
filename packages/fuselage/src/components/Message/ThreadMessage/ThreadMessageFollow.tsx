import ThreadMessageIcon from './ThreadMessageIcon';

/**
 * @deprecated Nothing renders it; thread previews only offer `ThreadMessageUnfollow`.
 */
const ThreadMessageFollow = () => <ThreadMessageIcon className='rcx-message-thread__icon--follow' name='bell' />;

export default ThreadMessageFollow;
