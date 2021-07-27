const createFormSubscription = () => {
	let forms = {};
	let updateCb = () => {};

	const formsSubscription = {
		subscribe: (cb) => {
			updateCb = cb;
			return () => {
				updateCb = () => {};
			};
		},
		getCurrentValue: () => forms,
	};
	const registerForm = (newForm) => {
		forms = { ...forms, ...newForm };
		updateCb();
	};
	const unregisterForm = (form) => {
		delete forms[form];
		updateCb();
	};

	return { registerForm, unregisterForm, formsSubscription };
};

export const { registerForm, unregisterForm, formsSubscription } = createFormSubscription();
