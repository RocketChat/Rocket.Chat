module.export({useIsFetching:()=>useIsFetching});let React;module.link('react',{"*"(v){React=v}},0);let parseFilterArgs,notifyManager;module.link('@tanstack/query-core',{parseFilterArgs(v){parseFilterArgs=v},notifyManager(v){notifyManager=v}},1);let useSyncExternalStore;module.link('./useSyncExternalStore.esm.js',{useSyncExternalStore(v){useSyncExternalStore=v}},2);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},3);




function useIsFetching(arg1, arg2, arg3) {
  const [filters, options = {}] = parseFilterArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const queryCache = queryClient.getQueryCache();
  return useSyncExternalStore(React.useCallback(onStoreChange => queryCache.subscribe(notifyManager.batchCalls(onStoreChange)), [queryCache]), () => queryClient.isFetching(filters), () => queryClient.isFetching(filters));
}


//# sourceMappingURL=useIsFetching.esm.js.map
