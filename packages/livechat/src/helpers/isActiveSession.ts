import store from '../store';

export const isActiveSession = () => {
	const sessionId = sessionStorage.getItem('sessionId');
	const { openSessionIds: [firstSessionId] = [] } = store.state;

	return sessionId === firstSessionId;
};
