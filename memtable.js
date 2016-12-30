var lodash = require('lodash')
var assert = require('assert')

//unique:[] unique keys
//primary:'id'   id prop
//resume:[] data to resume
//filterable:[] keys to store in memory to filter on
module.exports = function(props){

  var state = {}
  var propsToKeep = []

  function getTable(index){
    assert(index,'requires table unique index')
    var table = state[index]
    assert(table,'unable to find table with unique index ' + index)
    return table
  }

  function setBy(index,value){
    assert(value[index],'requires unique index value on ' + index)
    var table = getTable(index)
    table[value[index]] = value
    return value
  }

  function getBy(index,id){
    assert(id,'requires unique id')
    var table = getTable(index)
    var result = table[id]
    assert(result,'unable to find id: ' + id + ' on index: ' + index)
    return result
  }

  function hasBy(index,id){
    try{
      getBy(index,id) 
      return true
    }catch(e){
      return false
    }
  }

  function primary(){
    return getTable(props.primary)
  }

  function strip(value){
    return lodash.pick(value,propsToKeep)
  }

  function set(value){
    assert(value,'requires value with id prop')
    
    var tosave = props.saveAll ? value : strip(value)

    setBy(props.primary,tosave)

    lodash.each(props.unique,function(index){
      try{
        setBy(index,tosave)
      }catch(e){ }
    })

    return value
  }

  function isMatch(objectToSearch,query,propsToMatch,insensitive){
    return lodash.find(propsToMatch,function(prop){
      var value = insensitive ? lodash.toUpper(lodash.get(objectToSearch,prop)) : lodash.get(objectToSearch,prop)
      return lodash.includes(value,query)
    })
  }

  var methods = {}

  methods.get = function(id){
    return getBy(props.primary,id)
  }

  methods.getAll = function(ids){
    return lodash.map(ids,function(id){
      return methods.get(id)
    })
  }

  methods.getBy = function(prop,key){
    return getBy(prop,key)
  }

  methods.getAllBy = function(prop,keys){
    return lodash.map(keys,function(key){
      return methods.getBy(prop,key)
    })
  }

  methods.has = function(id){
    return hasBy(props.primary,id)
  }

  methods.hasBy = function(prop,id){
    return hasBy(prop,id)
  }

  methods.hasAll = function(ids){
    return lodash.map(ids,function(id){
      return methods.has(id)
    })
  }

  methods.hasAllBy = function(prop,ids){
    return lodash.map(ids,function(id){
      return methods.hasBy(prop,id)
    })
  }

  methods.set = function(value){
    props.onChange(set(value))
    return value
  }

  methods.setAll = function(values){
    return lodash.map(values,methods.set)
  }

  methods.filter = function(query,insensitive){
    query = insensitive ? lodash.toUpper(query) : query
    return lodash.filter(primary(),function(value,key){
      return isMatch(value,query,props.filterable,insensitive)
    })
  }

  methods.list = function(){
    return lodash.values(state[props.primary])
  }

  function init(p){
    props = lodash.defaults(p,{
      primary:'id',
      unique:[],
      filterable:[],
      save:[],
      resume:[],
      saveAll:false,
      onChange:function(x){return x},
    })
    propsToKeep = lodash.concat([props.primary],props.filterable,props.unique,props.save)
    state[props.primary] = {}
    lodash.each(props.unique,function(index){
      state[index] = {}
    })
    lodash.each(props.resume,set)
    return methods
  }

  return init(props)
}
