var test = require('tape')
var Table = require('../many-table')
var lodash = require('lodash')

test('many table',t=>{
  t.test('init',t=>{
    const table = Table('secondary','username')
    t.ok(table)
    t.end()
  })
  t.test('validate',t=>{
    const table = Table('secondary','username')
    const [id,old] = table.validate({username:'test'})
    t.equal(id,'test')
    t.notOk(old)
    t.end()
  })
  t.test('bad validate',t=>{
    const table = Table('secondary','username')
    try{
      table.validate({bad:'test'})
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('set',t=>{
    const table = Table('secondary','username')
    const value = {username:'test'}
    const result = table.set(value.username,value)
    t.equal(value,result)
    t.equal(value,table.get(value.username).next().value)
    t.end()
  })
  t.test('set many',t=>{
    t.plan(10)
    const table = Table('secondary','username')
    const values = lodash.times(5,i=>{
      return table.set('username',{
        id:i,
        username:'username'
      })
    })
    const result = table.get('username')
    lodash.each([...result],(value,i)=>{
      t.equal(value.id,i)
      t.equal(value.username,'username')
    })
  })

  t.test('get',t=>{
    const table = Table('secondary','username')
    const value = {username:'test'}
    table.set(value.username,value)
    t.equal(value,table.get('test').next().value)
    t.end()
  })
  
  t.test('getOne',t=>{
    const table = Table('secondary','username')
    try{
      table.getOne()
    }catch(e){
      t.ok(e)
      t.end()
    }
  })

  t.test('getSet',t=>{
    const table = Table('secondary','username')
    const value = {username:'test'}
    table.set(value.username,value)
    t.ok(table.getSet(value.username))
    t.end()
    
  })
  t.test('getIterator',t=>{
    const table = Table('secondary','username')
    const value = {username:'test'}
    table.set(value.username,value)
    t.ok(table.getIterator(value.username))
    t.end()
  })
  t.test('has',t=>{
    const table = Table('secondary','username')
    const value = {id:'test'}
    table.set(value.id,value)
    t.ok(table.has(value.id))
    t.notOk(table.has('dne'))
    t.end()
  })

  t.test('remove',t=>{
    const table = Table('secondary','username')
    const value = {id:'test'}
    table.set(value.id,value)
    const result = table.remove(value.id,value)
    t.notOk(table.get(value.id).next.value)
    t.end()
  })
  // t.test('remove2',t=>{
  //   const table = Table('secondary','done')
  // })

  t.test('compound',t=>{
    const table = Table('secondary',['first','last'])
    const user = { first:'0',last:'0' }
    const [id] = table.validate(user)
    table.set(id,user)
    const [result] = table.get([0,0].join('-'))
    t.deepEqual(result,user)
    t.end()
  })
  t.test('lodash',t=>{
    const table = Table('secondary','username')
    t.ok( table.lodash())
    t.end()
  })
  t.test('size',t=>{
    const table = Table('secondary','username')
    t.equal(table.size(),0)
    t.equal(table.size('id'),0)
    t.end()
  })
})



