var test = require('tape')
var Unique = require('../unique-table')
var lodash = require('lodash')

test('unique table',t=>{
  t.test('init',t=>{
    const table = Unique()
    t.ok(table)
    t.end()
  })
  t.test('validate',t=>{
    const table = Unique()
    const [id,old] = table.validate({id:'test'})
    t.equal(id,'test')
    t.notOk(old)
    t.end()
  })
  t.test('bad validate',t=>{
    const table = Unique()
    try{
      table.validate({bad:'test'})
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('bad validate on secondary',t=>{
    const table = Unique('secondary','email')
    const user = {
      email:`test0@example`,
      id:0,
    }
    table.set(user.email,user)
    try{
      table.validate({id:1,email:'test0@example'},null)
    }catch(e){
      t.ok(e)
      t.end()
    }
  })

  t.test('set',t=>{
    const table = Unique()
    const value = {id:'test'}
    const result = table.set(value.id,value)
    t.equal(value,result)
    t.equal(value,table.get('test'))
    t.end()
  })

  t.test('get',t=>{
    const table = Unique()
    const value = {id:'test'}
    table.set(value.id,value)
    t.equal(value,table.get('test'))
    t.end()
  })
  
  t.test('getOne',t=>{
    const table = Unique()
    const value = {id:'test'}
    table.set(value.id,value)
    t.equal(value,table.getOne('test'))
    t.end()
  })

  t.test('getSet',t=>{
    try{
      table.getSet()
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('getArray',t=>{
    try{
      table.getArray()
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('has',t=>{
    const table = Unique()
    const value = {id:'test'}
    table.set(value.id,value)
    t.ok(table.has(value.id))
    t.notOk(table.has('dne'))
    t.end()
  })

  t.test('remove',t=>{
    const table = Unique()
    const value = {id:'test'}
    table.set(value.id,value)
    const result = table.remove(value.id)
    t.notOk(table.get(value.id))
    t.end()
  })
})


