module.export({useHydrate:()=>useHydrate,Hydrate:()=>Hydrate});let React;module.link('react',{default(v){React=v}},0);let hydrate;module.link('../core',{hydrate(v){hydrate=v}},1);let useQueryClient;module.link('./QueryClientProvider',{useQueryClient(v){useQueryClient=v}},2);


function useHydrate(state, options) {
  var queryClient = useQueryClient();
  var optionsRef = React.useRef(options);
  optionsRef.current = options; // Running hydrate again with the same queries is safe,
  // it wont overwrite or initialize existing queries,
  // relying on useMemo here is only a performance optimization.
  // hydrate can and should be run *during* render here for SSR to work properly

  React.useMemo(function () {
    if (state) {
      hydrate(queryClient, state, optionsRef.current);
    }
  }, [queryClient, state]);
}
var Hydrate = function Hydrate(_ref) {
  var children = _ref.children,
      options = _ref.options,
      state = _ref.state;
  useHydrate(state, options);
  return children;
};