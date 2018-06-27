var test = require('tape')
var ID = require('../id')
var lodash = require('lodash')

test('id',t=>{
  t.test('init',t=>{
    const id = ID()
    t.ok(id)
    t.end()
  })
  t.test('setId',t=>{
    t.test('string',t=>{
      const {setId}= ID()
      const id = setId({ id:'test' })
      t.equal(id,'test')
      t.end()
    })
    t.test('number',t=>{
      const {setId} = ID(undefined,0)
      const id = setId(['test'])
      t.equal(id,'test')
      t.end()
    })
    t.test('function',t=>{
      const {setId} = ID(undefined,v=>v.join('-'))
      const id = setId(['hello','world'])
      t.equal(id,'hello-world')
      t.end()
    })
    t.test('array',t=>{
      const {setId} = ID(undefined,['id','test',['email','name'],x=>lodash.toUpper(x.upper)])
      const id = setId({
        id:'test',test:'hello world',email:'test@example.com',name:'test user',upper:'upper me'
      })
      t.equal(id,'test-hello world-test@example.com-test user-UPPER ME')
      t.end()
    })
    t.test('ok falsey values',t=>{
      const {setId} = ID()
      setId({id:0})
      setId({id:false})
      setId({id:-1})
      setId({id:''})
      t.end()
    })
    t.test('invalid',t=>{
      try{
        ID(undefined,{id:'invalid'})
      }catch(e){
        t.ok(e)
        t.end()
      }
    })
  })
  t.test('getId',t=>{
    t.test('string',t=>{
      const {getId}= ID()
      const id = getId('test')
      t.equal(id,'test')
      t.end()
    })
    t.test('number',t=>{
      const {getId} = ID()
      const id = getId(0)
      t.equal(id,0)
      t.end()
    })
    t.test('function',t=>{
      const {getId} = ID()
      const id = getId(x=>'hello-world')
      t.equal(id,'hello-world')
      t.end()
    })
    t.test('array',t=>{
      const {getId} = ID()
      const id = getId(['hello','world'])
      t.equal(id,'hello-world')
      t.end()
    })
    t.test('object',t=>{
      const {getId} = ID()
      const result = getId({id:'test',ignore:'this'})
      t.equal(result,'test')
      t.end()
    })
    t.test('complex array',t=>{
      const {getId} = ID()
      const result = getId(['hello',(x)=>'world',{id:'test',ignore:'me'}])
      t.equal(result,'hello-world-test')
      t.end()
    })
    t.test('invalid object',t=>{
      const {getId} = ID()
      try{
        getId({ignore:'this'})
      }catch(e){
        t.ok(e)
        t.end()
      }
    })
  })
})

