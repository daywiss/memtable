var lodash = require('lodash')
var assert = require('assert')
var highland = require('highland')
var ID = require('./id')

module.exports = function(name='id',index='id',required=true,delim='-'){
  const makeId = ID(name,index,required,delim)
  const kv = new Map()

  function validate(value,primary){
  }

  function set(value){
    let id = makeId(value)
    if(id != null) return kv.set(id,value)
  }
  function get(id){
    return kv.get(id)
  }
  function getAll(ids=[]){
    ids = lodash.castArray(ids)
    return ids.map(kv.get)
  }
  function has(id){
    return kv.has(id)
  }
  function values(){
    return kv.values()
  }
  function delete(value){
    let id = makeId(value)
    if(id != null) return kv.delete(id)
  }

  function keys(){
    return table.keys()
  }

  function map(map){
    return lodash.map(table,map)
  }

  function filter(filter){
    return lodash.filter(table,filter)
  }

  function reduce(reduce,start){
    return lodash.reduce(table,reduce,start)
  }

  function isMatch(objectToSearch,query,propsToMatch,insensitive){
    return lodash.find(propsToMatch,function(prop){
      var value = insensitive ? lodash.toUpper(lodash.get(objectToSearch,prop)) : lodash.get(objectToSearch,prop)
      return lodash.includes(value,query)
    })
  }

  function search(searchable,query,insensitive){
    query = insensitive ? lodash.toUpper(query) : query
    return lodash.filter(table,function(value,key){
      return isMatch(value,query,searchable,insensitive)
    })
  }

  function lodash(){
    return lodash(table)
  }

  function highland(includeKeys){
    if(includeKeys) return highland.pairs(table)
    return highland.values(table)
  }

  return {set,get,has,delete,id:makeId}
}
