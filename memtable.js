var lodash = require('lodash')
var assert = require('assert')

//secondary:[] secondary keys
//primary:'id'   id prop
//resume:[] data to resume
//filterable:[] keys to store in memory to filter on
module.exports = function(props){

  var state = {}
  var propsToKeep = []

  function getTable(index){
    assert(index === 0 || index,'requires table index')
    if(lodash.isArray(index)){
      index = lodash.join(index,props.delimiter)
    }
    var table = state[index]
    assert(table,'unable to find table with index ' + index)
    return table
  }

  function compositeIndex(composite,value){
    assert(lodash.every(composite,function(prop){ return lodash.has(value,prop) }),'Object Missing composite properties: ' + composite.join(props.delimiter))
    return lodash.reduce(composite,function(result,prop){
      result.push(lodash.get(value,prop))
      return result
    },[]).join(props.delimiter)
  }

  function setBy(index,value){
    var table = getTable(index)
    if(lodash.isArray(index)){
      index = compositeIndex(index,value)
    }else{
      index = value[index]
    }
    table[index] = value
    return value
  }

  function getBy(index,id){
    assert(id === 0 || id,'requires secondary id')
    var table = getTable(index)
    if(lodash.isArray(id)){
      id = lodash.join(id,props.delimiter)
    }
    var result = table[id]
    assert(result,'unable to find id: ' + id + ' on index: ' + index)
    return result
  }

  function removeBy(index,value){
    var table = getTable(index)

    if(lodash.isArray(index)){
      index = compositeIndex(index,value)
    }else{
      index = value[index]
    }
    delete table[index]
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

  function remove(value){
    assert(value,'requires value with id')
    removeBy(props.primary,value)
    lodash.each(props.secondary,function(index){
      try{
        removeBy(index,value)
      }catch(e){ }
    })
    lodash.each(props.composite,function(index){
      try{
        removeBy(index,value)
      }catch(e){ }
    })
    return value
  }

  function set(value){
    assert(value,'requires value with id prop')

    var tosave = props.saveAll ? value : strip(value)

    lodash.each(props.required,function(prop){
      assert(tosave[prop],'required property ' + prop + ' not found')
    })

    setBy(props.primary,tosave)

    lodash.each(props.secondary,function(index){
      try{
        setBy(index,tosave)
      }catch(e){ }
    })

    //save composite index
    lodash.each(props.composite,function(index){
      // console.log(index)
      //ignore if object does not have all props
      // if(lodash.every(index,function(prop){ return lodash.has(tosave,prop) })){
        try{
          // console.log('setting composite',index)
          setBy(index,tosave)
        }catch(e){ 
          // throw e
        }
      // }
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

  methods.getBy = function(prop,key){
    return getBy(prop,key)
  }

  methods.get = function(id){
    return methods.getBy(props.primary,id)
  }

  methods.getAll = function(ids){
    return lodash.map(ids,function(id){
      return methods.get(id)
    })
  }

  methods.getAllBy = function(prop,keys){
    return lodash.map(keys,function(key){
      return methods.getBy(prop,key)
    })
  }

  methods.hasBy = function(prop,id){
    return hasBy(prop,id)
  }

  methods.has = function(id){
    return methods.hasBy(props.primary,id)
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
    try{
      //remove if previously set so we can cleanly re index
      remove(get(value[props.primary]))
    }catch(e){ }

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

  methods.filterBy = function(prop,query,insensitive){
    query = insensitive ? lodash.toUpper(query) : query
    return lodash.filter(primary(),function(value,key){
      return isMatch(value,query,[prop],insensitive)
    })
  }

  methods.list = function(){
    return lodash.values(state[props.primary])
  }

  methods.removeBy = function(prop,id){
    var value = remove(methods.getBy(prop,id))
    props.onRemove(value)
    return value
  }


  methods.remove = function(id){
    return methods.removeBy(props.primary,id)
  }

  methods.removeAll = function(ids){
   return lodash.map(ids,methods.remove)
  }

  methods.removeAllBy = function(prop,ids){
    return lodash.map(ids,function(id){
      return methods.removeBy(prop,id)
    })
  }

  methods.drop = function(){
    lodash.each(state,function(value,key){
      state[key] = {}
    })
  }

  methods.state = function(){
    return state
  }

  function init(p){
    props = lodash.defaults(p,{
      primary:'id',
      secondary:[],
      composite:[],
      filterable:[],
      required:[],
      save:[],
      resume:[],
      saveAll:false,
      delimiter:'.',
      onChange:function(x){return x},
      onRemove:function(x){return x},
    })
    propsToKeep = lodash.concat(
        [props.primary],
        props.filterable,
        props.secondary,
        props.save,
        props.required,
        lodash.flatten(props.composite)
    )
    state[props.primary] = {}
    lodash.each(props.secondary,function(index){
      state[index] = {}
    })

    lodash.each(props.composite,function(composite){
      assert(lodash.isArray(composite),'composite props require an array of prop name strings')
      state[lodash.join(composite,props.delimiter)] = {}
    })

    lodash.each(props.resume,set)

    return methods
  }

  return init(props)
}
