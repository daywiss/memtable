var lodash = require('lodash')
var assert = require('assert')
var Promise = require('bluebird')


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
      }catch(e){}
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

  methods.get = Promise.method(function(id){
    return props.get(getBy(props.primary,id))
  })

  methods.getAll = Promise.method(function(ids){
    return Promise.all(lodash.map(ids,function(id){
      return methods.get(id)
    }))
  })

  methods.getBy = Promise.method(function(prop,key){
    return props.get(getBy(prop,key))
  })

  methods.getAllBy = Promise.method(function(prop,keys){
    return Promise.all(lodash.map(keys,function(key){
      return methods.getBy(prop,key)
    }))
  })

  methods.has = Promise.method(function(id){
    return hasBy(props.primary,id)
  })

  methods.hasBy = Promise.method(function(prop,id){
    return hasBy(prop,id)
  })

  methods.hasAll = Promise.method(function(ids){
    return Promise.all(lodash.map(ids,function(id){
      return methods.has(id)
    }))
  })

  methods.hasAllBy = Promise.method(function(prop,ids){
    return Promise.all(lodash.map(ids,function(id){
      return methods.hasBy(prop,id)
    }))
  })

  methods.set = Promise.method(function(value){
    return props.preChange(value).then(function(){
      return set(value)
    }).then(function(){
      return props.postChange(value)
    }).then(function(result){
      return [result,props.onChange(result)]
    }).spread(function(result){
      return result
    })
  })

  methods.setAll = Promise.method(function(values){
    return Promise.all(lodash.map(values,methods.set))
  })

  methods.filter = Promise.method(function(query,insensitive){
    query = insensitive ? lodash.toUpper(query) : query
    return lodash.filter(primary(),function(value,key){
      return isMatch(value,query,props.filterable,insensitive)
    })
  })

  methods.list = Promise.method(function(){
    return lodash.values(state[props.primary])
  })

  function init(p){
    props = lodash.defaults(p,{
      primary:'id',
      unique:[],
      filterable:[],
      resume:[],
      saveAll:false,
      preChange:function(x){return Promise.resolve(x)},
      onChange:function(x){return x},
      postChange:function(x){return Promise.resolve(x)},
      get:function(x){ return Promise.resolve(x)}
    })
    propsToKeep = lodash.concat([props.primary],props.filterable,props.unique)
    state[props.primary] = {}
    lodash.each(props.unique,function(index){
      state[index] = {}
    })
    lodash.each(props.resume,set)
    return methods
  }

  return init(props)
}
