'use client';module.export({useQueries:()=>useQueries});let React;module.link('react',{"*"(v){React=v}},0);let QueriesObserver,notifyManager;module.link('@tanstack/query-core',{QueriesObserver(v){QueriesObserver=v},notifyManager(v){notifyManager=v}},1);let useSyncExternalStore;module.link('./useSyncExternalStore.esm.js',{useSyncExternalStore(v){useSyncExternalStore=v}},2);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},3);let useIsRestoring;module.link('./isRestoring.esm.js',{useIsRestoring(v){useIsRestoring=v}},4);let useQueryErrorResetBoundary;module.link('./QueryErrorResetBoundary.esm.js',{useQueryErrorResetBoundary(v){useQueryErrorResetBoundary=v}},5);let ensurePreventErrorBoundaryRetry,useClearResetErrorBoundary,getHasError;module.link('./errorBoundaryUtils.esm.js',{ensurePreventErrorBoundaryRetry(v){ensurePreventErrorBoundaryRetry=v},useClearResetErrorBoundary(v){useClearResetErrorBoundary=v},getHasError(v){getHasError=v}},6);let ensureStaleTime,shouldSuspend,fetchOptimistic,willFetch;module.link('./suspense.esm.js',{ensureStaleTime(v){ensureStaleTime=v},shouldSuspend(v){shouldSuspend=v},fetchOptimistic(v){fetchOptimistic=v},willFetch(v){willFetch=v}},7);









function useQueries({
  queries,
  context
}) {
  const queryClient = useQueryClient({
    context
  });
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedQueries = React.useMemo(() => queries.map(options => {
    const defaultedOptions = queryClient.defaultQueryOptions(options); // Make sure the results are already in fetching state before subscribing or updating options

    defaultedOptions._optimisticResults = isRestoring ? 'isRestoring' : 'optimistic';
    return defaultedOptions;
  }), [queries, queryClient, isRestoring]);
  defaultedQueries.forEach(query => {
    ensureStaleTime(query);
    ensurePreventErrorBoundaryRetry(query, errorResetBoundary);
  });
  useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React.useState(() => new QueriesObserver(queryClient, defaultedQueries));
  const optimisticResult = observer.getOptimisticResult(defaultedQueries);
  useSyncExternalStore(React.useCallback(onStoreChange => isRestoring ? () => undefined : observer.subscribe(notifyManager.batchCalls(onStoreChange)), [observer, isRestoring]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, {
      listeners: false
    });
  }, [defaultedQueries, observer]);
  const shouldAtLeastOneSuspend = optimisticResult.some((result, index) => shouldSuspend(defaultedQueries[index], result, isRestoring));
  const suspensePromises = shouldAtLeastOneSuspend ? optimisticResult.flatMap((result, index) => {
    const options = defaultedQueries[index];
    const queryObserver = observer.getObservers()[index];

    if (options && queryObserver) {
      if (shouldSuspend(options, result, isRestoring)) {
        return fetchOptimistic(options, queryObserver, errorResetBoundary);
      } else if (willFetch(result, isRestoring)) {
        void fetchOptimistic(options, queryObserver, errorResetBoundary);
      }
    }

    return [];
  }) : [];

  if (suspensePromises.length > 0) {
    throw Promise.all(suspensePromises);
  }

  const observerQueries = observer.getQueries();
  const firstSingleResultWhichShouldThrow = optimisticResult.find((result, index) => {
    var _defaultedQueries$ind, _defaultedQueries$ind2;

    return getHasError({
      result,
      errorResetBoundary,
      useErrorBoundary: (_defaultedQueries$ind = (_defaultedQueries$ind2 = defaultedQueries[index]) == null ? void 0 : _defaultedQueries$ind2.useErrorBoundary) != null ? _defaultedQueries$ind : false,
      query: observerQueries[index]
    });
  });

  if (firstSingleResultWhichShouldThrow != null && firstSingleResultWhichShouldThrow.error) {
    throw firstSingleResultWhichShouldThrow.error;
  }

  return optimisticResult;
}


//# sourceMappingURL=useQueries.esm.js.map
