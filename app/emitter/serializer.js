export const message = JSON.stringify;
export const subscription = JSON.stringify;
export const room = JSON.stringify;
export const setting = JSON.stringify;
export const permission = JSON.stringify;

export const deserializer = {
	subscription: JSON.parse,
	room: JSON.parse,
	message: JSON.parse,
};
