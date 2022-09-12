module.export({useQueries:()=>useQueries});let React,useMemo;module.link('react',{default(v){React=v},useMemo(v){useMemo=v}},0);let notifyManager;module.link('../core/notifyManager',{notifyManager(v){notifyManager=v}},1);let QueriesObserver;module.link('../core/queriesObserver',{QueriesObserver(v){QueriesObserver=v}},2);let useQueryClient;module.link('./QueryClientProvider',{useQueryClient(v){useQueryClient=v}},3);



function useQueries(queries) {
  var mountedRef = React.useRef(false);

  var _React$useState = React.useState(0),
      forceUpdate = _React$useState[1];

  var queryClient = useQueryClient();
  var defaultedQueries = useMemo(function () {
    return queries.map(function (options) {
      var defaultedOptions = queryClient.defaultQueryObserverOptions(options); // Make sure the results are already in fetching state before subscribing or updating options

      defaultedOptions.optimisticResults = true;
      return defaultedOptions;
    });
  }, [queries, queryClient]);

  var _React$useState2 = React.useState(function () {
    return new QueriesObserver(queryClient, defaultedQueries);
  }),
      observer = _React$useState2[0];

  var result = observer.getOptimisticResult(defaultedQueries);
  React.useEffect(function () {
    mountedRef.current = true;
    var unsubscribe = observer.subscribe(notifyManager.batchCalls(function () {
      if (mountedRef.current) {
        forceUpdate(function (x) {
          return x + 1;
        });
      }
    }));
    return function () {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [observer]);
  React.useEffect(function () {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, {
      listeners: false
    });
  }, [defaultedQueries, observer]);
  return result;
}