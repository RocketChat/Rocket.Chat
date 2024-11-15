'use client';module.export({useMutation:()=>useMutation});let React;module.link('react',{"*"(v){React=v}},0);let parseMutationArgs,MutationObserver,notifyManager;module.link('@tanstack/query-core',{parseMutationArgs(v){parseMutationArgs=v},MutationObserver(v){MutationObserver=v},notifyManager(v){notifyManager=v}},1);let useSyncExternalStore;module.link('./useSyncExternalStore.esm.js',{useSyncExternalStore(v){useSyncExternalStore=v}},2);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},3);let shouldThrowError;module.link('./utils.esm.js',{shouldThrowError(v){shouldThrowError=v}},4);






function useMutation(arg1, arg2, arg3) {
  const options = parseMutationArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const [observer] = React.useState(() => new MutationObserver(queryClient, options));
  React.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = useSyncExternalStore(React.useCallback(onStoreChange => observer.subscribe(notifyManager.batchCalls(onStoreChange)), [observer]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  const mutate = React.useCallback((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop);
  }, [observer]);

  if (result.error && shouldThrowError(observer.options.useErrorBoundary, [result.error])) {
    throw result.error;
  }

  return { ...result,
    mutate,
    mutateAsync: result.mutate
  };
} // eslint-disable-next-line @typescript-eslint/no-empty-function

function noop() {}


//# sourceMappingURL=useMutation.esm.js.map
