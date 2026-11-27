import { useEffect, useState } from 'react';

import { isHttpError, loadHistory, sendMessage, subscribeRoom, type ChatMessage, type RoomItem } from './api';
import type { Session } from './session';

const errorText = (e: unknown) => (isHttpError(e) ? `HTTP ${e.status}` : e instanceof Error ? e.message : String(e));

// A room's history, live messages and composer, shared by the plain and the Fuselage screens
export function useRoom(session: Session, room: RoomItem) {
	// Newest first, rendered by an inverted list.
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState('');
	const [error, setError] = useState<string>();
	const [live, setLive] = useState(false);

	useEffect(() => {
		let active = true;
		const upsert = (m: ChatMessage) =>
			setMessages((prev) => (prev.some((p) => p._id === m._id) ? prev.map((p) => (p._id === m._id ? m : p)) : [m, ...prev]));

		// Subscribe before loading history so nothing sent in between is missed; upsert dedupes.
		const sub = subscribeRoom(session, room.rid, upsert);
		sub.ready().then(
			() => active && setLive(true),
			(e) => setError(errorText(e)),
		);
		loadHistory(session, room).then(
			(history) => active && setMessages((prev) => [...prev, ...history.filter((h) => !prev.some((p) => p._id === h._id))]),
			(e) => setError(errorText(e)),
		);
		return () => {
			active = false;
			sub.stop();
		};
	}, [session, room]);

	// Resolves false when the send failed, so a caller that owns its field can put the text back
	const sendText = async (text: string) => {
		const msg = text.trim();
		if (!msg) return true;
		try {
			await sendMessage(session, room.rid, msg);
			return true;
		} catch (e) {
			setError(errorText(e));
			return false;
		}
	};

	const send = async () => {
		const msg = draft.trim();
		if (!msg) return;
		setDraft('');
		if (!(await sendText(msg))) setDraft(msg);
	};

	return { messages, draft, setDraft, error, live, send, sendText };
}
