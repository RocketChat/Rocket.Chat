'use client';module.export({useBaseQuery:()=>useBaseQuery});let React;module.link('react',{"*"(v){React=v}},0);let notifyManager;module.link('@tanstack/query-core',{notifyManager(v){notifyManager=v}},1);let useSyncExternalStore;module.link('./useSyncExternalStore.esm.js',{useSyncExternalStore(v){useSyncExternalStore=v}},2);let useQueryErrorResetBoundary;module.link('./QueryErrorResetBoundary.esm.js',{useQueryErrorResetBoundary(v){useQueryErrorResetBoundary=v}},3);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},4);let useIsRestoring;module.link('./isRestoring.esm.js',{useIsRestoring(v){useIsRestoring=v}},5);let ensurePreventErrorBoundaryRetry,useClearResetErrorBoundary,getHasError;module.link('./errorBoundaryUtils.esm.js',{ensurePreventErrorBoundaryRetry(v){ensurePreventErrorBoundaryRetry=v},useClearResetErrorBoundary(v){useClearResetErrorBoundary=v},getHasError(v){getHasError=v}},6);let ensureStaleTime,shouldSuspend,fetchOptimistic;module.link('./suspense.esm.js',{ensureStaleTime(v){ensureStaleTime=v},shouldSuspend(v){shouldSuspend=v},fetchOptimistic(v){fetchOptimistic=v}},7);









function useBaseQuery(options, Observer) {
  const queryClient = useQueryClient({
    context: options.context
  });
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedOptions = queryClient.defaultQueryOptions(options); // Make sure results are optimistically set in fetching state before subscribing or updating options

  defaultedOptions._optimisticResults = isRestoring ? 'isRestoring' : 'optimistic'; // Include callbacks in batch renders

  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager.batchCalls(defaultedOptions.onError);
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager.batchCalls(defaultedOptions.onSuccess);
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = notifyManager.batchCalls(defaultedOptions.onSettled);
  }

  ensureStaleTime(defaultedOptions);
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
  useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = React.useState(() => new Observer(queryClient, defaultedOptions));
  const result = observer.getOptimisticResult(defaultedOptions);
  useSyncExternalStore(React.useCallback(onStoreChange => {
    const unsubscribe = isRestoring ? () => undefined : observer.subscribe(notifyManager.batchCalls(onStoreChange)); // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.

    observer.updateResult();
    return unsubscribe;
  }, [observer, isRestoring]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, {
      listeners: false
    });
  }, [defaultedOptions, observer]); // Handle suspense

  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  } // Handle error boundary


  if (getHasError({
    result,
    errorResetBoundary,
    useErrorBoundary: defaultedOptions.useErrorBoundary,
    query: observer.getCurrentQuery()
  })) {
    throw result.error;
  } // Handle result property usage tracking


  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}


//# sourceMappingURL=useBaseQuery.esm.js.map
