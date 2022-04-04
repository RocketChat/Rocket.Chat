import { generator } from './generator';

export type IFrameAction = {
	id: string;
	icon: string;
	label: string;
};

const { listen, add, remove, store } = generator<IFrameAction>();
export { listen, add, remove, store };
