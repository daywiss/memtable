const lodash = require('lodash')
const assert = require('assert')

module.exports = function(name='primary',index='id',required=true,delim='-'){
  assert(name != null,'Id requires a name')
  assert(index != null,'Id requires an index lookup')

  function test(value){
    if(required) assert(value != null,`Missing required index field: ${name}`)
    return value
  }

  function setId(name,index,required,delim){
    if(lodash.isNumber(index)){
      return function(obj){
        return test(lodash.get(obj,index,null))
      }       
    }
    if(lodash.isString(index)){
      return function(obj){
        return test(lodash.get(obj,index,null))
      }
    }

    if(lodash.isFunction(index)){
     return function(obj){
        return test(index(obj))
      }
    }

    if(lodash.isArray(index)){
      return function(obj){
        return lodash.map(index,i=>{
          return setId(name,i,required,delim)(obj)
        }).join(delim)
      }
    }
    throw new Error(`Invalid index for ${name}, it needs to be a string, number, function or array`)
  }

  function getId(val){
    if(lodash.isFunction(val)){
      return getId(val(name,index,required,delim))
    }
    if(lodash.isArray(val)){
      return lodash.map(val,v=>{
        return getId(v)
      }).join(delim)
    }
    if(lodash.isObject(val)){
      return setId(name,index,required,delim)(val)
    }
    return val
  }

  return {setId:setId(name,index,required,delim),getId}
}

// module.exports = function(name='primary',index='id',required=true,delim='-'){
//   assert(name != null,'Id requires a name')
//   assert(index != null,'Id requires an index lookup')
//   function test(value){
//     if(required) assert(value != null,`Missing required index field: ${name}`)
//     return value
//   }
//   if(lodash.isNumber(index)){
//     return function(obj){
//       return test(lodash.get(obj,index,null))
//     }
//   }

//   if(lodash.isString(index)){
//     return function(obj){
//       return test(lodash.get(obj,index,null))
//     }
//   }

//   if(lodash.isFunction(index)){
//     return function(obj){
//       return test(index(obj))
//     }
//   }

//   if(lodash.isArray(index)){
//     return function(obj){
//       return lodash.map(index,i=>{
//         return module.exports(name,i,required,delim)(obj)
//       }).join(delim)
//     }
//   }

//   throw new Error(`Invalid index for ${name}, it needs to be a string, number, function or array`)
// }
