var test = require('tape')
var Table = require('../memtable')
var lodash = require('lodash')

let table = null
const users = lodash.times(5,i=>{
  return {
    id:i,
    username:'user ' + i, 
    email:'email ' + i,
    role:i%2 ? 'user':'admin',
    first:'first '+i,
    last:'last '+i
  }
})
test('memtable',t=>{
  t.test('init',t=>{
    table = Table({
      indexes:[
        {name:'email',index:'email',required:true,unique:true},
        {name:'username',index:'username',required:true,unique:false},
        {name:'role',index:'role',required:false,unique:false},
        {name:'age',index:'age',required:false,unique:false},
        {name:'fullname',index:['first','last'],required:false,unique:false},
      ],
      searchable:['email','username','first','last']
    })
    t.ok(table)
    t.end()
  })
  t.test('set',t=>{
    var result = users.map(table.set)
    t.deepEqual(result,table.setAll(users))
    t.end()
  })
  t.test('set alternate primary',t=>{
    const table = Table({
      primary:{index:'_id'}
    })
    table.set({_id:0})
    const result = table.get(0)
    t.equal(result._id,0)
    t.end()
  })
  t.test('get',t=>{
    const result = table.get(users[0].id)
    t.equal(users[0],result)
    t.end()
  })
  t.test('getBy',t=>{
    const result = table.getBy('email',users[0].email)
    t.equal(users[0],result)
    t.end()
  })
  t.test('getAllBy',t=>{
    var emails = users.map(u=>u.email)
    const result = table.getAllBy('email',emails)
    t.deepEqual(users,result)
    t.end()

  })
  t.test('getAll',t=>{
    var ids = users.map(u=>u.id)
    const result = table.getAll(ids)
    t.deepEqual(users,result)
    t.end()
  })
  t.test('get by role',t=>{
    const result = table.getBy('role','user')
    t.deepEqual([...result],users.filter(u=>u.role == 'user'))
    t.end()
  })
  t.test('get all by role',t=>{
    const result = table.getAllBy('role',['user'])
    t.deepEqual([...result[0]],users.filter(u=>u.role == 'user'))
    t.end()
  })
  t.test('get by fullname',t=>{
    const [...result] = table.getBy('fullname',['first 0','last 0'])
    t.deepEqual(result[0],users[0])
    t.end()
  })
  t.test('has',t=>{
    const result = table.has(users[0].id)
    t.notOk(table.has('dne'))
    t.ok(result)
    t.end()
  })
  t.test('update',t=>{
    const result = lodash.times(users.length,i=>{
      return table.update(i,{age: i%2==0? 20:30})
    })
    result.forEach(r=>{
      t.ok(r.age)
    })
    t.end()
  })
  t.test('get by age',t=>{
    const [...result] = table.getBy('age',20)
    t.ok(result.length)
    t.end()
  })
  t.test('remove',t=>{
    const result = table.remove(users[0].id)
    t.notOk(table.has(users[0].id))
    t.ok(result)
    t.end()
  })
  t.test('emitter',t=>{
    table.on('change',x=>x)
    t.end()

  })
})
