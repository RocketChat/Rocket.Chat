module.export({useIsomorphicLayoutEffect:()=>useIsomorphicLayoutEffect});let useEffect,useLayoutEffect;module.link('react',{useEffect(v){useEffect=v},useLayoutEffect(v){useLayoutEffect=v}},0);
function useIsomorphicLayoutEffect(callback, deps) {
  // eslint-disable-next-line
  if (typeof window === 'undefined') return useEffect(callback, deps);
  return useLayoutEffect(callback, deps);
}
