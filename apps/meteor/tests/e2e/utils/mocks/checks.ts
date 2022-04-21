export let publicChannelCreated = false;
export let privateChannelCreated = false;
export let directMessageCreated = false;

export function setPublicChannelCreated(status: boolean): void {
	publicChannelCreated = status;
}

export function setPrivateChannelCreated(status: boolean): void {
	privateChannelCreated = status;
}

export function setDirectMessageCreated(status: boolean): void {
	directMessageCreated = status;
}
