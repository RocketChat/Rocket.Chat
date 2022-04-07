module.export({useIsFetching:()=>useIsFetching});let React;module.link('react',{default(v){React=v}},0);let notifyManager;module.link('../core/notifyManager',{notifyManager(v){notifyManager=v}},1);let parseFilterArgs;module.link('../core/utils',{parseFilterArgs(v){parseFilterArgs=v}},2);let useQueryClient;module.link('./QueryClientProvider',{useQueryClient(v){useQueryClient=v}},3);



function useIsFetching(arg1, arg2) {
  var mountedRef = React.useRef(false);
  var queryClient = useQueryClient();

  var _parseFilterArgs = parseFilterArgs(arg1, arg2),
      filters = _parseFilterArgs[0];

  var _React$useState = React.useState(queryClient.isFetching(filters)),
      isFetching = _React$useState[0],
      setIsFetching = _React$useState[1];

  var filtersRef = React.useRef(filters);
  filtersRef.current = filters;
  var isFetchingRef = React.useRef(isFetching);
  isFetchingRef.current = isFetching;
  React.useEffect(function () {
    mountedRef.current = true;
    var unsubscribe = queryClient.getQueryCache().subscribe(notifyManager.batchCalls(function () {
      if (mountedRef.current) {
        var newIsFetching = queryClient.isFetching(filtersRef.current);

        if (isFetchingRef.current !== newIsFetching) {
          setIsFetching(newIsFetching);
        }
      }
    }));
    return function () {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [queryClient]);
  return isFetching;
}