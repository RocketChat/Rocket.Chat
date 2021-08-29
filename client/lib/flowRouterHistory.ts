import {
	createMemoryHistory,
	History,
	LocationDescriptor,
	LocationDescriptorObject,
	LocationState,
} from 'history';
import { FlowRouter } from 'meteor/kadira:flow-router';

const promptBeforeUnload = (event: BeforeUnloadEvent): void => {
	event.preventDefault();
	event.returnValue = '';
};

export const createFlowRouterHistory = (): History => {
	const memoryHistory = createMemoryHistory();

	const contextPrototype = (FlowRouter as any)._page.Context.prototype;
	const { pushState, save } = contextPrototype;

	contextPrototype.pushState = function (this: any, ...args: any[]): void {
		memoryHistory.push(this.path, memoryHistory.location.state);
		return pushState.apply(this, args);
	};

	contextPrototype.save = function (this: any, ...args: any[]): void {
		memoryHistory.replace(this.path, memoryHistory.location.state);
		return save.apply(this, args);
	};

	memoryHistory.replace(FlowRouter.current().path, {});

	let blockersCount = 0;

	const history: History = {
		get length() {
			return memoryHistory.length;
		},
		get action() {
			return memoryHistory.action;
		},
		get location() {
			return memoryHistory.location;
		},
		push(to: LocationDescriptor, state?: LocationState) {
			const path = typeof to === 'string' ? to : memoryHistory.createHref(to);
			state = state ?? memoryHistory.location.state;

			setTimeout(() => {
				memoryHistory.location.state = state;
				FlowRouter.go(path);
			}, 0);
		},
		replace(to: LocationDescriptor, state?: LocationState) {
			const path = typeof to === 'string' ? to : memoryHistory.createHref(to);
			state = state ?? memoryHistory.location.state;

			setTimeout(() => {
				memoryHistory.location.state = state;
				FlowRouter.withReplaceState(() => {
					FlowRouter.go(path);
				});
			}, 0);
		},
		createHref(to: LocationDescriptorObject) {
			return memoryHistory.createHref(to);
		},
		go(delta: number) {
			memoryHistory.go(delta);
			window.history.go(delta);
		},
		goBack() {
			this.go(-1);
		},
		goForward() {
			this.go(1);
		},
		listen(listener) {
			return memoryHistory.listen(listener);
		},
		block(blocker) {
			const unblock = memoryHistory.block(blocker);

			blockersCount++;

			if (blockersCount === 1) {
				window.addEventListener('beforeunload', promptBeforeUnload);
			}

			return function (): void {
				unblock();

				blockersCount--;

				if (blockersCount === 0) {
					window.removeEventListener('beforeunload', promptBeforeUnload);
				}
			};
		},
	};

	return history;
};

let history: History;

export const getFlowRouterHistory = (): History => {
	if (!history) {
		history = createFlowRouterHistory();
	}

	return history;
};
