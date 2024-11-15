module.export({useIsomorphicLayoutEffect:function(){return useIsomorphicLayoutEffect}});var useEffect,useLayoutEffect;module.link('react',{useEffect:function(v){useEffect=v},useLayoutEffect:function(v){useLayoutEffect=v}},0);
function useIsomorphicLayoutEffect(callback, deps) {
  // eslint-disable-next-line
  if (typeof window === 'undefined') return useEffect(callback, deps);
  return useLayoutEffect(callback, deps);
}
