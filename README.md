#MemTable
Basic operations on a database table, but in memory, all syncronous calls. 
Only retains data from objects required for table operations to minimize memory footprint, 
such as unique indexes and filterable fields. Use in conjunction with a permanent data store. 

#Install
`npm install memtable`

#Why
Allows you to cache data in a way to be essentially database agnostic and still have useful queries
all done in memory.  As long as you are not dealing with big data, memory is a perfectly fine store for
millions of entries. Your backend store just needs to supply the ability to upsert on change event, and 
restore table on start.

#Usage
```js
  var Table = require('memtable')

  //all options optional
  var users = Table({
    primary:'id', //primary index, defaults to id, must be unique
    unique:['login','email'], //unique secondary ids
    filterable:['name','email','login'], //non unique properties which can be searched
    save:[] //specify any data you want saved in memory
    saveAll:false, //save all props in memory, for known small data objects
    resume:[], //an array of data to initialize table with
  })

  //set returns a promise since it passes data through to async database
  users.set({
    id:'id0',
    name:'name0',
    email:'email0',
    login:'login0',
    created:Date.now(), //this property will be stripped out, make sure its persisted somewhere else
  })

  //returns user, but a version of the user missing unnecessary props
  var user = users.get('id0')

  //query table by "login" property and return a single result
  user = users.getBy('login','login0')

  //returns an array of users which partially matches any "filterable" properties
  var result = users.filter('0')

  //returns true, since primary id exists in table
  var exists = users.has('id0')

``` 

#Restore and Persist data

```js
   //assume we have a user model that uses promises to persist data to database
   var UserModel = require('./UserModel')

   //keep store eventually consistent with memory model
   //for better consistency, persist data asyncronously, then update memtable on success.
   function handleChange(data){
     //upserts data into persistence model
     UserModel.upsert(data)
   }

   //assume we can get the entire table as an array this way
   UserModel.getAll().then(function(users){
     var users = Table({
       //resume previously persisted users
       resume:users,
       //set memtable to only retain 'id' field (default primary key) and 'email' field
       unique:['email'],
       //the table will call this every time memory is changed, it will ignore any return value.
       onChange:handleChange
     })

     //...do stuff with users table
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
    save:[], //properties on object to always store in memory, but not to index or filter on
    saveAll:false, //save entire object in memory rather than just primary/unique/filterable props. Only do if you know objects are small. 
    preChange:function(x){ return Promise.resolve(x)}, //this function will get called before memory is changed, and wait for promise to resolve or reject
    postChange:function(x){return Promise.resolve(x)}, //this function is called after preChange, before onChange, expects a promise to return data. The result will be passed to onChange.
    onChange:function(x){ return x}, //this function will get called after memory is changed, anything returned from it is ignored
    get:function(x){ return Promise.resolve(x)} //function to get the full data object from your persistent data store.
  }
``` 

##Reading and Writing
Gets and sets will throw errors if object or ids do not exist. Has will not throw, but return true or false.

```js
  try{
    //get single object
    var result = table.get('primaryid')
  }catch(e){
    //object did not exist
  }

  try{
    //get list of objects
    var result = table.getAll(['primary0','primary1'])
  }catch(e){
    //object did not exist
  }

  try{
    //gets object by 'unique' indexed property
    var result = table.getBy('uniquepropname','uniqueid')
  }catch(e){
    //object did not exist
  }

  try{
    //gets object by 'unique' indexed property and returns array
    var result = table.getAllBy('uniquepropname',['uniqueid1','uniqueid2'])
  }catch(e){
    //object did not exist
  }

  //"has" will always return true or false, will not throw
  //result is true if object with id "primaryid" exists 
  var result = table.has('primaryid')
   
  //check if object exists by secondary unique property, will not throw 
  //result is true if object with secondary id "secondaryid" exists 
  var result = table.hasBy('uniquepropname','uniqueid')

  //check if list of ids exist, will not throw
  //result is array of true/false values
  var result = table.hasAll(listofids)

  //check if list of unique secondary ids exist, will not throw
  //result is array of true/false values
  var result = table.hasAllBy('uniquepropname',listofuniqueids)

  try{
    //get entire table as array
    //result is array of all objects in table
    var result = table.list()
  }catch(e){
    //some fatal error, should not throw
  }

  try{
    //partially searches all filterable properties
    //returns array of objects which partially match 
    var result = table.filter('searchterm')
  }catch(e){
    //some fatal error, should not throw
  }

  try{
    //update memory with new object, replaces whatever was at that id
    //result is myobject
    var result = table.set(myobject).then(function(result){
  }catch(e){
    //primary property not set
  }

  try{
    //results equals objectarray
    var result = table.setAll(objectarray)
  }catch(e){
    //primary property not set
  }
```




