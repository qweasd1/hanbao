/**
 * Created by tony on 3/17/17.
 */
'use strict'
const Manager = require('./../lib/index');
const _ = require('lodash');

let p1 = function (manager,next){
  manager.addService("new1",{})
  
  manager.addModel({name:`p1-model-1`})
  // manager.addModel({name:"p1-model-2"})
  
  manager.addModelProcessor("populate",function (manager, model,next){
    console.log(`process 1 for ${model.name}`);
    next()
  })
  
  next()
}
_.merge(p1,{
  utils:{a:1},
  info:{name:"p1"}
})

let p2 = function (manager,next){
  
  // manager.addModel({name:"p2-model-1"})
  // manager.addModel({name:"p2-model-2"})
  
  
  
  manager.addModelProcessor("populate",function (manager,model,next){
    console.log(`process 2 for ${model.name}`);
    next()
    // manager.reprocessModel(model,null,next)
    // manager.reprocessModel(manager.models["p1-model-1"],null,(err)=>{
    //   if(err){
    //     next(err)
    //   }
    //   else {
    //     console.log(`process 2 for ${model.name}`);
    //     next()
    //   }
    // })
    
  })
  next()
}



_.merge(p2,{
  utils:{a:1},
  info:{name:"p2"}
})



let p3 = function (manager,next){
  
  // manager.addModel({name:"p2-model-1"})
  // manager.addModel({name:"p2-model-2"})
  
  
  
  manager.addModelProcessor("populate",function (manager,model,next){
    console.log(`process 3 for ${model.name}`);
    
    if(!manager.models.new){
      manager.addModelDynamically({name:"new"},null,(err)=>{
        
        if(err){
          next(err)
        }
        else {
          next()
        }
      })
    }
    else {
      next()
    }
    
    
    
    
  })
  
  next()
}



_.merge(p3,{
  utils:{a:1},
  info:{name:"p3"}
})

Manager({
  workingDir:__dirname,
  plugins:[
    p1,
    p2,
    p3,
    "./externalplugin",
    {
      plugin:"./pluginfactory",
      options:{name:"test"}
    }
  ]
}).init(function (err,manager){
  
  
  if(err){
    console.log(err);
  }
  else {
    
    console.log(manager.hasService("new1"));
  }
  
})
