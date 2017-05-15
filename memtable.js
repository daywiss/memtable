var lodash = require('lodash')
var assert = require('assert')
var highland = require('highland')

//secondary:[] secondary keys
//primary:'id'   id prop
//resume:[] data to resume
//filterable:[] keys to store in memory to filter on
module.exports = function(props){

  var state = {}
  var propsToKeep = []
  var propsRequired = []
  var uniqueProps = []
  var primaryProps = []

  function getTable(index){
    assert(index === 0 || index,'requires table index')
    index = makeKey(index)
    var table = state[index]
    assert(table,'unable to find table with index ' + index)
    return table
  }

  //joins array of properties together to make a key
  function makeKey(keys){
    if(lodash.isArray(keys)){
      return lodash.join(keys,props.delimiter)
    }
    //order is not guaranteed here so this is a problem
    if(lodash.isObject(keys)){
      return lodash(keys).keys().join(props.delimiter).value()
    }
    return keys
  }

  //check for unique props by looking at all secondary ids
  //then comparing to make sure values primary ids match or dont exist
  function collides(value){
    var id = getPrimaryID(value) 
    return lodash.some(props.secondary,function(index){
      var val = null
      try{
        val = getBy(index,compositeIndex(index,value))
      }catch(e){
        return false
      }
      return getPrimaryID(val) != id
    })
  }

  function touchesPrimary(prop){
    assert(prop,'requires prop')
    prop = lodash.toPath(prop)
    prop = prop[0]
    return lodash.some(primaryProps,function(p){
      return p == prop
    })
  }

  function getPrimaryID(value){
    return compositeIndex(props.primary,value)
  }

  //gets unique key from object and returns array
  function compositeIndex(composite,value){
    if(!lodash.isArray(composite)){
      return lodash.get(value,composite)
    }
    var hasAllProps = lodash.every(composite,function(prop){ 
      return lodash.has(value,prop) 
    })

    assert(hasAllProps,'Object Missing required composite properties: ' + makeKey(composite))
    return makeKey(lodash.reduce(composite,function(result,prop){
      result.push(lodash.get(value,prop))
      return result
    },[]))
  }

  function setBy(index,value){
    var table = getTable(index)
    index = compositeIndex(index,value)
    table[index] = value
    return value
  }

  function getBy(index,id){
    assert(id === 0 || id,'requires id')
    var table = getTable(index)
    id = makeKey(id)
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
      if(props.warn)  console.log(e)
      return false
    }
  }

  function primary(){
    return getTable(props.primary)
  }

  function strip(value){
    return lodash.pick(value,propsToKeep)
  }

  //takes an object, and returns whats stored in table
  //based on input object propsk
  function get(value){
    assert(value,'requires value with primary id')
    var index = null
    if(lodash.isArray(props.primary)){
      index = compositeIndex(props.primary,value)
    }else{
      index = value[index]
    }
    return getBy(props.primary,index)
  }


  function updateSecondaryIDs(next,prev){
    lodash.each(props.secondary,function(index){
      var a, b = null
      if(lodash.isArray(index)){
        try{
          a = compositeIndex(index,prev)
          b = compositeIndex(index,next)
        }catch(e){
          if(props.warn) console.log(e)
        }
      }else{
        a =  lodash.get(prev,index)
        b = lodash.get(next,index)
      }
      if(a==b) return
      removeBy(index,prev)
    })
    return next
  }

  function removeSecondaryIndices(value){
    lodash.each(props.secondary,function(index){
      try{
        removeBy(index,value)
      }catch(e){ 
        if(props.warn) console.log(e)
      }
    })
  }

  function remove(value){
    assert(value,'requires value with id')
    removeBy(props.primary,value)
    removeSecondaryIndices(value)
    return value
  }

  //dumb set
  function set(value){
    assert(value,'requires value with id prop')

    var tosave = props.saveAll ? value : strip(value)

    lodash.each(propsRequired,function(prop){
      assert(lodash.has(tosave,prop),'required property ' + prop + ' not found')
    })

    lodash.each(props.secondary,function(index){
      try{
        setBy(index,tosave)
      }catch(e){ 
        if(props.warn) console.log(e)
      }
    })

    setBy(props.primary,tosave)

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
    assert(!collides(value),'Trying to set a record which collides with unique value of another record')
    var id = getPrimaryID(value)
    if(methods.has(id)){
      //value exists at this id, delete all secondary references
      var prev = getBy(props.primary,id)
      updateSecondaryIDs(value,prev)
    }
    var result = set(value)
    props.onChange(result,id)
    return value
  }

  methods.setAll = function(values){
    return lodash.map(values,methods.set)
  }

  //index is the table index name
  //id is the unique id of the item
  //prop is the property on the item to update
  //value is the value on the item property to update
  methods.updateBy = function(index,id,kv){
    assert(lodash.isPlainObject(kv),'requires an object with key value')
    var item = methods.getBy(index,id)
    //if all props are the same do nothing and return item
    if(lodash.every(kv,function(value,key){
      return lodash.isEqual(value,item[key])
    })){
      return item
    }

    lodash.each(function(value,key){
      assert(!touchesPrimary(key),'you cannot update primary id, use set instead')
    })
    //we need to remove all references to  secondary ids which may have changed
    return methods.set(lodash.assign({},item,kv))
    // return methods.set(lodash.assign(lodash.cloneDeep(item),kv))
  }

  //update record by merging in kv
  methods.update = function(id,kv){
    return methods.updateBy(props.primary,id,kv)
  }

  methods.search = function(query,insensitive){
    query = insensitive ? lodash.toUpper(query) : query
    return lodash.filter(primary(),function(value,key){
      return isMatch(value,query,props.searchable,insensitive)
    })
  }

  methods.filter = function(filter){
    return lodash.filter(primary(),filter)
  }

  methods.reduce = function(reduce,start){
    return lodash.reduce(primary(),reduce,start)
  }

  methods.map = function(map){
    return lodash.map(primary(),map)
  }

  methods.each = function(each){
    return lodash.each(primary(),each)
  }

  //syncronous data iteration
  methods.lodash = function(includeKeys){
    if(includeKeys) return lodash(primary())
    return lodash(primary()).values()
  }

  //async stream data 
  methods.highland = function(includeKeys){
    if(includeKeys) return highland.pairs(primary())
    return highland.values(primary())
  }

  methods.list = function(){
    return lodash.values(primary())
  }

  methods.sort = function(props,direction){
    return lodash.orderBy(primary(),props,direction)
  }

  methods.removeBy = function(prop,id){
    var value = remove(methods.getBy(prop,id))
    props.onRemove(value,getPrimaryID(value))
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

  methods.getPrimaryID = getPrimaryID

  function init(p){
    props = lodash.defaults(p,{
      primary:'id',
      secondary:[],
      searchable:[],
      required:[],
      save:[],
      resume:[],
      saveAll:false,
      delimiter:'.',
      onChange:function(x){return x},
      onRemove:function(x){return x},
    })

    propsToKeep = lodash([props.primary])
      .concat( 
        props.searchable,
        props.secondary,
        props.save,
        props.required
      )
      .flattenDeep()
      .uniq()
      .value()

    propsRequired = lodash([props.primary])
      .concat(props.required)
      .flattenDeep()
      .uniq()
      .value()

    uniqueProps = lodash([props.primary])
      .concat(props.secondary)
      .flattenDeep()
      .uniq()
      .value()

    primaryProps = lodash.flatten([props.primary])

    state[makeKey(props.primary)] = {}

    lodash.each(props.secondary,function(index){
      index = makeKey(index)
      state[index] = {}
    })

    lodash.each(props.resume,set)

    return methods
  }

  return init(props)
}
