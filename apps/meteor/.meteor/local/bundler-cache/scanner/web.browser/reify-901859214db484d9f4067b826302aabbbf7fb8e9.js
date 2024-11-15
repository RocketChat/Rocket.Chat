module.export({useIsMutating:()=>useIsMutating});let React;module.link('react',{"*"(v){React=v}},0);let useSyncExternalStore;module.link('./useSyncExternalStore.esm.js',{useSyncExternalStore(v){useSyncExternalStore=v}},1);let parseMutationFilterArgs,notifyManager;module.link('@tanstack/query-core',{parseMutationFilterArgs(v){parseMutationFilterArgs=v},notifyManager(v){notifyManager=v}},2);let useQueryClient;module.link('./QueryClientProvider.esm.js',{useQueryClient(v){useQueryClient=v}},3);




function useIsMutating(arg1, arg2, arg3) {
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const mutationCache = queryClient.getMutationCache();
  return useSyncExternalStore(React.useCallback(onStoreChange => mutationCache.subscribe(notifyManager.batchCalls(onStoreChange)), [mutationCache]), () => queryClient.isMutating(filters), () => queryClient.isMutating(filters));
}


//# sourceMappingURL=useIsMutating.esm.js.map
