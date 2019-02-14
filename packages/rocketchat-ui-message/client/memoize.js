import mem from 'mem';

export default (fn) => mem(fn, { maxAge: 1000 });
