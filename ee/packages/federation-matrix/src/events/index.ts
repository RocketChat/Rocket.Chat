import { edus } from './edu';
import { member } from './member';
import { message } from './message';
import { ping } from './ping';
import { reaction } from './reaction';
import { room } from './room';

export function registerEvents() {
	void ping();
	message();
	reaction();
	member();
	void edus();
	room();
}
