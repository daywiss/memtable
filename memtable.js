var lodash = require('lodash')
var assert = require('assert')
var highland = require('highland')

var UniqueTable = require('./unique-table')
var ManyTable = require('./many-table')

var ID = require('./id')

module.exports = function(config={},cb=x=>x){
  assert(lodash.isFunction(cb),'Callback must be a function')
  function defaultConfig(props){
    return lodash.defaultsDeep(props,{
      primary:{index:'id',required:true,unique:true},
      indexes:[ ],
      preSet:x=>x,
      postGet:x=>x,
    })
  }

  config = defaultConfig(config)

  const indexes = new Map()
  const primary = UniqueTable('primary',config.primary.index,true)

  lodash.each(config.indexes,(opts,name)=>{
    addIndex(opts.name,opts.index,opts.required,opts.unique,opts.delimiter)
  })

  config = defaultConfig(config)

  function emit(type,value,id,prev,update,indexes){
    try{
      cb({ type,value,prev,update,indexes })
    }catch(e){
      e.message = `Memtable change notification callback failed with Error: ${e.message}`
      throw e
    }
  }

  function getIndex(name='primary'){
    if(name=='primary') return primary
    assert(indexes.has(name),'Index by ' + name + ' does not exist')
    return indexes.get(name)
  }
  
  function addIndex(name,index,required,unique,delimiter){
    if(unique){
      indexes.set(name,UniqueTable(name,index,required,delimiter))
    }else{
      indexes.set(name,ManyTable(name,index,required,delimiter))
    }
  }

  function initIndex(){
    primary.each((value,id)=>{
      set(value,true)
    })
  }

  function listen(listener){
    assert(lodash.isFunction(listener),'Callback must be a function')
    cb = listener
  }

  function removeIndex(name){
    indexes.delete(name)
  }

  function valuesBy(name){
    const table = getIndex(name)
    return table.values()
  }

  function values(){
    valuesBy('primary')
  }

  function setSilent(value){
    return set(value,true)
  }

  function set(value,silent=false){
    const primary = getIndex()
    
    value = config.preSet(value,primary.size())

    const [id,prev] = primary.validate(value,null,true)

    const ids = {}
    indexes.forEach((index,name)=>{
      const result = index.validate(value,prev)
      ids[name] = result[0]
    })

    primary.set(id,value)
    indexes.forEach((index,name)=>{
      //remove old data, set new data. check that old data
      //is undefined otherwise entire set might be deleted
      if(prev !== undefined){
        const [secondaryId] = index.validate(prev,null,true)
        index.remove(secondaryId,prev)
      }
      index.set(ids[name],value)
    })

    if(!silent) emit('set',value,id,prev,value,ids)
    return config.postGet(value)
  }

  function setAll(values=[]){
    values = lodash.castArray(values)
    return values.map(set)
  }

  function update(id,value){
    return updateBy('primary',id,value)
  }

  function updateBy(name='primary',id,value,silent){
    const index = getIndex(name)
    const prev = index.getOne(id)
    const result = set(lodash.merge(prev,value),true)
    if(!silent) emit('update',result,id,prev,value,name)
    return result
  }

  function get(id,fallback){
    return getBy('primary',id,fallback)
  }

  function getBy(name='primary',id,fallback){
    const result = getAllBy(name,[id],fallback)
    return result[0]
  }

  function getAll(ids,fallback){
    return getAllBy('primary',ids,fallback)
  }

  function getAllBy(name='primary',ids=[],fallback){
    ids = lodash.castArray(ids)
    let table = getIndex(name)
    return ids.map(id=>{
      const val = table.get(id)
      if(val == null) return fallback

      if(table.type == 'many'){
        const result = []
        for(const  data of val){
          result.push(config.postGet(data))
        }
        return result
      }else{
        return config.postGet(val)
      }
    })
  }

  function has(id){
    return hasBy('primary',id)
  }

  function hasBy(name='primary',id){
    const result = hasAllBy(name,[id])
    return result[0]
  }

  function hasAllBy(name='primary',ids=[]){
    ids = lodash.castArray(ids)
    let table = getIndex(name)
    return ids.map(table.has)
  }

  function removeBy(name='primary',id){
    assert(id,'data id required')
    const result = removeAllBy(name,[id])
    return result[0]
  }

  //tortured logic, but this allows us to 
  //remove both unique/non unique secondary indexes
  //with a common interface
  function removeAllBy(name='primary',ids=[],silent){
    ids = lodash.castArray(ids)
    const table = getIndex(name)
    const result = []
    ids.forEach(id=>{
      const prev = table.get(id)
      if(table.type == 'many'){
        const removed = []
        for(const val of prev){
          removed.push(remove(val,silent))
        }
        result.push(removed)
      }else{
        result.push(remove(prev,silent))
      }
    })
    return result
  }

  function remove(id,silent){
    const result = removeAll([id],silent)
    return result[0]
  }

  function removeAll(ids=[],silent){
    ids = lodash.castArray(ids)
    const table = getIndex()
    const result = []
    ids.forEach(id=>{
      const prev = table.remove(id)
      result.push(prev)
      indexes.forEach(index=>{
        index.remove(id,prev)
      })
      if(!silent) emit('remove',null,id,prev,null,'primary')
    })

    return result
  }

  function values(name,id){
    return getIndex(name).values(id)
  }
  function keys(name,id){
    return getIndex(name).keys(id)
  }
  function entries(name,id){
    return getIndex(name).entries(id)
  }
  function ld(name,id,entries){
    return getIndex(name).lodash(id,entries)
  }
  function hl(name,id,entries){
    return getIndex(name).highland(id,entries)
  }
  function map(map,name,id){
    return getIndex(name).map(map,id)
  }
  function filter(filter,name,id){
    return getIndex(name).filter(filter,id)
  }
  function reduce(reduce,start,name,id){
    return getIndex(name).reduce(reduce,start,id)
  }
  function each(each,name,id){
    return getIndex(name).each(each,id)
  }
  function search(query,insensitive,name,id){
    return getIndex(name).search(query,insensitive,id)
  }
  function size(name,id){
    return getIndex(name).size(id)
  }

  return {
    get,getAll,getBy, getAllBy,
    set, setAll,update, updateBy,
    setSilent, listen,
    has, hasBy, hasAllBy,
    remove, removeAll,
    removeBy, removeAllBy,
    addIndex,removeIndex,initIndex,getIndex,
    values,keys,entries,
    lodash:ld,highland:hl,
    map,filter,reduce,size
  }
}
