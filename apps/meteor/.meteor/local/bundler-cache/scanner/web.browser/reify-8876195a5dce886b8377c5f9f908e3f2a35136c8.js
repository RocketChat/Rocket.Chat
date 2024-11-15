'use client';module.export({useInfiniteQuery:()=>useInfiniteQuery});let parseQueryArgs,InfiniteQueryObserver;module.link('@tanstack/query-core',{parseQueryArgs(v){parseQueryArgs=v},InfiniteQueryObserver(v){InfiniteQueryObserver=v}},0);let useBaseQuery;module.link('./useBaseQuery.esm.js',{useBaseQuery(v){useBaseQuery=v}},1);



function useInfiniteQuery(arg1, arg2, arg3) {
  const options = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(options, InfiniteQueryObserver);
}


//# sourceMappingURL=useInfiniteQuery.esm.js.map
