'use client';module.export({Hydrate:()=>Hydrate,useHydrate:()=>useHydrate});let React;module.link('react',{"*"(v){React=v}},0);let hydrate;module.link('@tanstack/query-core',{hydrate(v){hydrate=v}},1);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},2);




function useHydrate(state, options = {}) {
  const queryClient = useQueryClient({
    context: options.context
  });
  const optionsRef = React.useRef(options);
  optionsRef.current = options; // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization.
  // hydrate can and should be run *during* render here for SSR to work properly

  React.useMemo(() => {
    if (state) {
      hydrate(queryClient, state, optionsRef.current);
    }
  }, [queryClient, state]);
}
const Hydrate = ({
  children,
  options,
  state
}) => {
  useHydrate(state, options);
  return children;
};


//# sourceMappingURL=Hydrate.esm.js.map
