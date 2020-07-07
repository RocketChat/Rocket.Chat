import { createPhemeralPortal } from '../../../../client/reactAdapters';

let dom;
let unregister;
const createAchor = () => {
	const div = document.createElement('div');
	div.id = 'react-user-card';
	document.body.appendChild(div);
	return div;
};


export const close = () => {
	if (!dom) {
		return;
	}
	unregister();
};

export const open = async (args, target) => {
	dom = dom || createAchor();
	unregister = await createPhemeralPortal(() => import('../../../../client/components/UserCard'), () => ({ ...args, target, onClose: close }), dom);
};
