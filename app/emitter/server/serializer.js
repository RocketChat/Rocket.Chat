// import msg from 'msgpack5';
// const msgpack = msg();
// export const subscription = msgpack.encode;

export const subscription = JSON.stringify;
export const room = JSON.stringify;
export const message = JSON.stringify;
export const setting = JSON.stringify;
export const permission = JSON.stringify;
