type publishReturn = void | Mongo.Cursor<any> | Mongo.Cursor<any>[] | Promise<void | Mongo.Cursor<any> | Mongo.Cursor<any>[]>;

type overwritedPublishParam = {
	name: string | null;
	func: (...args: any[]) => publishReturn;
	args: unknown[];
};

let runPublish = ({ func, args }: overwritedPublishParam): publishReturn => {
	return func.apply(this, args);
};

export function setSubscriptionOverwrite(func: (param: overwritedPublishParam) => publishReturn): void {
	runPublish = func;
}

export function runOverwrittenPublish(this: Subscription, param: overwritedPublishParam): publishReturn {
	return runPublish.call(this, param);
}
