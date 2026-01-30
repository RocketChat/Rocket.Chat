export const fireGlobalEventBase = (eventName: string, detail?: unknown) => {
	window.dispatchEvent(new CustomEvent(eventName, { detail }));

	const dispatchMessage = (iframeSendEnabled: boolean, sendTargetOrigin: string) => {
		if (!iframeSendEnabled) {
			return;
		}
		parent.postMessage(
			{
				eventName,
				data: detail,
			},
			sendTargetOrigin,
		);
	};

	return dispatchMessage;
};
