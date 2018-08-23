const lodash = require('lodash')
const assert = require('assert')
const highland = require('highland')
const ID = require('./id')
const utils = require('./utils')
const KV = require('./kv')

module.exports = function(name='primary',index='id',required=true,delim='-'){
  const {setId,getId} = ID(name,index,required,delim)
  const kv = KV(getId)

  function validate(next,prev,overwrite){
    const id = setId(next)
    if(id == null) return [id,null]
    var old = getOne(id)
    if(overwrite) return [id,old]
    if(old != null) assert(prev === old,`Unable to set because key is not unique: ${name}`)
    return [id,old]
  }

  function set(id,value){
    if(id == null) return value
    kv.set(id,value)
    return value
  }

  function getOne(id){
    return kv.get(id)
  }

  function getArray(){
    throw new Error('Unable to get array of values from an index with unique values which only returns single values')
  }

  function getSet(){
    throw new Error('Unable to get set of values from an index with unique values which only returns single values')
  }

  function get(id){
    return getOne(id)
  }

  function getAll(ids=[]){
    ids = lodash.castArray(ids)
    return ids.map(kv.get)
  }
  function has(id){
    return kv.has(id)
  }
  function remove(id){
    if(id == null) return
    var value = get(id)
    kv.delete(id)
    return value
  }
  //helpers
  function values(){
    return kv.values()
  }
  function keys(){
    return kv.keys()
  }
  function entries(){
    return kv.entries()
  }
  function size(){
    return kv.size()
  }
  function ld(id,kv){
    if(kv) return utils.lodash([...entries()])
    return utils.lodash([...values()])
  }
  function hl(id,kv){
    if(kv) return utils.highland(entries())
    return utils.highland(values())
  }
  function map(map){
    return utils.map(entries(),map)
  }
  function filter(filter){
    return utils.filter(entries(),map)
  }
  function reduce(reduce,init){
    return utils.reduce(entries(),reduce,init)
  }
  function each(each,id){
    return utils.each(entries(),each)
  }
  return {
    set,get,getOne,getArray,getSet,has,remove,validate,size,
    values, keys,entries,lodash:ld,highland:hl,map,filter,reduce,
    type:'unique',
  }
}
