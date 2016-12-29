#MemTable
Basic operations on a database table, but in memory. Uses promises. 
Allows data to pass through to persistent store and resuming from persisted data.  
Only retains data from objects required for table operations to minimize
memory footprint, such as unique indexes and filterable fields.  

#Install
`npm install memtable`

#Why
Allows you to cache data in a way to be essentially database agnostic and still have useful queries
all done in memory while staying consistent with your persistent datastore.
As long as you are not dealing with big data, memory is a perfectly fine store for
millions of entries. Your backend store just needs to supply the ability to upsert and get all values
as an array. 

#Usage
```js
  var Table = require('memtable')

  //all options optional
  var users = Table({
    primary:'id', //primary index, defaults to id, must be unique
    unique:['login','email'], //unique secondary ids
    filterable:['name','email','login'], //non unique properties which can be searched
    resume:[], //an array of data to initialize table with
  })

  //set returns a promise since it passes data through to async database
  users.set({
    id:'id0',
    name:'name0',
    email:'email0',
    login:'login0',
  })

  //get returns promise, though query is done in memory
  users.get('id0').then(function(user){
    //do something with user
  })

  //returns a single user which does a full match on the query for that "unique" id
  users.getBy('login','login0').then(function(user){
    //do something with user
  })

  //returns an array of users which partially matches any "filterable" properties
  users.filter('email0',function(result){
    //do something with results
  })


``` 

#Restore and Persist data

```js
   //assume we have a user model that uses promises to persist data to database
   var UserModel = require('./UserModel')

   function upsert(data){
     //upserts data, returns the data in a promise
     return UserModel.upsert(data)
   }

   //assume we can get the entire table as an array this way
   UserModel.getAll().then(function(users){
     var users = Table({
       //preChange fires every time set is called, allows you to allow or deny data before memory is updated
       preChange:upsert,
       //resume previously persisted users
       resume:users,
       //set memtable to only retain 'id' field (default primary key) and 'email' field
       unique:['email'],
     })

     //use the users table
   })
   

``` 

#API

##Initialization Options
```js
var Table = require('memtable')
table = Table(options)
``` 
```js
  //default option values
  options = {
    primary:'id' //default primary key property 
    unique:[], //list indexable properties as strings
    filterable:[], //incomplete searchable properties as strings
    resume:[], //array of table objects to resume from
    preChange:function(x){ return Promise.resolve(x)}, //this function will get called before memory is changed, and wait for promise to resolve or reject
    postChange:function(x){return Promise.resolve(x)}, //this function is called after preChange, before onChange, expects a promise to return data. The result will be passed to onChange.
    onChange:function(x){ return x}, //this function will get called after memory is changed, anything returned from it is ignored
    get:function(x){ return Promise.resolve(x)} //function to get the full data object from your persistent data store.
  }
``` 

#Reading and Writing
```js
  //get single object
  table.get('primaryid').then(function(result){
    //do something with object
  })

  //get list of objects
  table.getAll(['primary0',primary1']).then(function(result){
    //do something with array
  })

  //gets object by 'unique' indexed property
  table.getBy('uniquepropname','uniqueid').then(function(result){
    //do something with single object
  })

  //gets object by 'unique' indexed property
  table.getAllBy('uniquepropname',['uniqueid1','uniqueid2']).then(function(result){
    //do something with array
  })

  //get entire table as array
  table.list().then(function(result){

  })

  //partially searches all filterable properties
  table.filter('searchterm').then(function(result){
    //returns array of objects which partially match 
  })

  //update memory with new object, replaces whatever was at that id
  table.set(myobject).then(function(result){
    //result is myobject
  })
```




