import { edus } from './edu.js';
import { member } from './member.js';
import { message } from './message.js';
import { ping } from './ping.js';
import { reaction } from './reaction.js';
import { room } from './room.js';

export function registerEvents() {
	void ping();
	message();
	reaction();
	member();
	void edus();
	room();
}
