const lodash = require('lodash')
const assert = require('assert')
const highland = require('highland')
exports.map = (entries,map)=>{
  let count = 0
  return Array.from(entries,e=>{
    return map(e[1],e[0],count++)
  })
}
exports.filter = (entries,filter)=>{
  var result = []
  let count = 0
  for(let e of entries){
    if(filter(e[1],e[0],count++)) result.push(e[1])
  }
  return result
}
exports.reduce = (entries,reduce,init)=>{
  var result = init
  let count = 0
  for(let e of entries){
    result = reduce(result,e[1],e[0],count++)
  }
  return result
}
exports.each = (entries,each)=>{
  let count = 0
  for(let e of entries){
    each(e[1],e[0],count++) 
  }
}
exports.lodash = function(values){
  return lodash(Array.from(values))
}
exports.highland = function(values){
  return highland(values)
}
exports.array = function(values){
  return Array.from(values)
}
