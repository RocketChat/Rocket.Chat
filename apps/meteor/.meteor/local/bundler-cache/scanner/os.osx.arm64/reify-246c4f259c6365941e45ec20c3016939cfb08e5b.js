module.export({normalize_columns_array:()=>normalize_columns_array});let CsvError;module.link('./CsvError.js',{CsvError(v){CsvError=v}},0);let is_object;module.link('../utils/is_object.js',{is_object(v){is_object=v}},1);



const normalize_columns_array = function(columns){
  const normalizedColumns = [];
  for(let i = 0, l = columns.length; i < l; i++){
    const column = columns[i];
    if(column === undefined || column === null || column === false){
      normalizedColumns[i] = { disabled: true };
    }else if(typeof column === 'string'){
      normalizedColumns[i] = { name: column };
    }else if(is_object(column)){
      if(typeof column.name !== 'string'){
        throw new CsvError('CSV_OPTION_COLUMNS_MISSING_NAME', [
          'Option columns missing name:',
          `property "name" is required at position ${i}`,
          'when column is an object literal'
        ]);
      }
      normalizedColumns[i] = column;
    }else{
      throw new CsvError('CSV_INVALID_COLUMN_DEFINITION', [
        'Invalid column definition:',
        'expect a string or a literal object,',
        `got ${JSON.stringify(column)} at position ${i}`
      ]);
    }
  }
  return normalizedColumns;
};


