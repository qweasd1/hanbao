/**
 * Created by tony on 3/18/17.
 */
'use strict'
module.exports = function (options){
  let p5 = function (manager,next){
    let modelName = options && options.name || "pluginfactory"
    
    manager.addModel({name:modelName})
    
    next()
  }
  
  p5.info = {name:"pluginFactory"}
  
  return p5
}