'use client';module.export({useQuery:()=>useQuery});let parseQueryArgs,QueryObserver;module.link('@tanstack/query-core',{parseQueryArgs(v){parseQueryArgs=v},QueryObserver(v){QueryObserver=v}},0);let useBaseQuery;module.link('./useBaseQuery.esm.js',{useBaseQuery(v){useBaseQuery=v}},1);



function useQuery(arg1, arg2, arg3) {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(parsedOptions, QueryObserver);
}


//# sourceMappingURL=useQuery.esm.js.map
