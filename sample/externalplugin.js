/**
 * Created by tony on 3/18/17.
 */
'use strict'
let p4 = function (manager,next){
  
  
  manager.addModel({name:`external`})
  
  

  next()
}

p4.info = {name:"p4"}

module.exports =  p4