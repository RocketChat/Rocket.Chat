export let publicChannelCreated = false;
export let privateChannelCreated = false;
export let directMessageCreated = false;

export function setPublicChannelCreated(status) {
	publicChannelCreated = status;
}

export function setPrivateChannelCreated(status) {
	privateChannelCreated = status;
}

export function setDirectMessageCreated(status) {
	directMessageCreated = status;
}
