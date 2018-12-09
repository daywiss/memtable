const ID = require('./id')
const assert = require('assert')
const highland = require('highland')
const lodash = require('lodash')
const utils = require('./utils')
const KV = require('./kv')

module.exports = function(name,index,required=true,delim='-'){
  assert(name,'requires index name')
  assert(index,'requires index key')

  const {setId,getId} = ID(name,index,required,delim)
  const kv = KV(getId)

  function validate(next,prev){
    const id = setId(next)
    return [id,null]
  }

  function set(id,value){
    if(id == null) return value 
    if(!kv.has(id)) kv.set(id,new Set())
    kv.get(id).add(value)
    return value
  }

  function getOne(id){
    throw new Error('Unable to get one value from a non unique index which returns array of values')
  }

  function getIterator(id){
    if(!kv.has(id)) return []
    return kv.get(id).values()
  }

  function getSet(id){
    return kv.get(id) || new Set()
  }

  function get(id){
    return getIterator(id)
  }

  function has(id){
    if(!kv.has(id)) return false
    return kv.get(id).size > 0
  }

  function each(fn){
    return kv.forEach(fn)
  }

  function remove(id,value){
    if(id == null) return 
    if(!kv.has(id)) return
    if(value !== undefined){
      kv.get(id).delete(value)
    }else{
      kv.delete(id)
    }
    return value
  }

  function values(id){
    if(id != null) return get(id)
    return kv.values()
  }

  function keys(id){
    if(id != null) return getSet(id).keys()
    return kv.keys()
  }
  function entries(id){
    if(id != null) return getSet(id).entries()
    return kv.entries()
  }

  function size(id){ 
    if(id == null) return kv.size()
    return getSet(id).size
  }


  function ld(id,kv){
    if(kv) return utils.lodash([...entries(id)])
    return utils.lodash([...values(id)])
  }
  function hl(id,kv){
    if(kv) return utils.highland(entries(id))
    return utils.highland(values(id))
  }
  function map(map,id){
    return utils.map(entries(id),map)
  }
  function filter(filter,id){
    return utils.filter(entries(id),filter)
  }
  function reduce(reduce,init,id){
    return utils.reduce(entries(id),reduce,init)
  }
  function each(each,id){
    return utils.each(entries(id),each)
  }
  return {
    validate,set,get,getIterator,getSet,getOne,remove,has,size,
    values, keys,entries,lodash:ld,highland:hl,map,filter,reduce,
    type:'many',
  }
}

