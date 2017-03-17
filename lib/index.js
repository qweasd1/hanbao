/**
 * Created by tony on 3/15/17.
 */
'use strict'
const _ = require('lodash');
const HanbaoError = require('./error');
const helper = require('./helper');


let PHASE = {
  runPlugin:"run plugin",
  modelProcessing:"model processing"
}


// some default utils for model engine
// addModel(model,options)
// addService(service,options)
// addModelProcessor(processor)

// patternMatch(pattern,target):boolean

function createDefaultUtils(){
  return {
    runCallbacksInSequence:helper.runCallbacksInSequence
  }
}

function assert(isTrue,message,data){
    if(!isTrue){
      let error = new HanbaoError(message,data)
      Error.captureStackTrace(error,assert)
      throw error
    }
}

// we flatten and add trace to plugins and return the flatten version
function compilePlugins(oringPlugins){
    let flattenedPlugins = []
    let trace = []
    oringPlugins.forEach((plugin)=>{
      recursiveCompileSinglePlugin(plugin,trace,flattenedPlugins)
    })

    return flattenedPlugins
}

function recursiveCompileSinglePlugin(plugin, trace, flattenedPlugins){
    assert(plugin.info,"plugin must has 'info' attribute")


    if(Array.isArray(plugin)){
      trace.push(plugin.info)
      for (let subplugin of plugin) {
        recursiveCompileSinglePlugin(subplugin, trace,flattenedPlugins)
      }
      trace.pop()
    }
    else {
      plugin._debug = {
        trace:_.clone(trace)
      }
      flattenedPlugins.push(plugin)
    }

}



 class Manager {
  constructor(options) {
    this.utils = createDefaultUtils()

    // we flatten the plugins and add debug information for them
    assert(Array.isArray(options.plugins), "plugins for Manager should be an Array")
    this.plugins = compilePlugins(options.plugins)

    // merge utils from plugins to defualt utils, currently, we suppose utils won't rely on manager information
    this.plugins.forEach((plugin) => {
      _.merge(this.utils, plugin.utils)
    })

    // create services
    this.services = {}

    // create meta
    this._meta = {}

    // create models
    this.models = {}
    this._modelList = []

    //create modelProcessor
    this.modelProcessors = []
    this._modelProcessorSet = new Set()

  }
  
  init(cb){
    
    this.runPlugins((err)=>{
      
      if(err){
         
         cb(err)
      }
      else {
        this.runModelProcessing((err)=>{
          
          if(err){
            cb(err)
          }
          else {
            cb(null,this)
          }
        })
      }
    })
  }

  runPlugins(next){
    this._phase = PHASE.runPlugin
    // run plugins
    helper.runCallbacksInSequence(
        this.plugins.map( plugin=>{
            return (cb)=>{
              // add debug information on err
              let detailCb = (err)=>{
                if(err){

                  err.plugin = plugin
                   cb(err)
                }
                else {
                  cb()
                }
              }
              try {
                // update the current running plugin on mananger, so if addModelProcessor() called, we know in which plugin we are running
                this._currentRunningPlugin = plugin
                plugin(this,detailCb)
              }
              catch (err){
                detailCb(err)
              }

            }
        } ),
        (err)=>{
          if(err){
             next(err)
          }
          else {
            
            next(null,this)
          }
        }
    )

  }

  runModelProcessing(next){
    this._phase = PHASE.modelProcessing
    this._processorCursor = 0
    this._isInReprocess = {}
    helper.runCallbacksInSequence(this.modelProcessors.map(processor=>this._processSingleLayerModel.bind(this,processor)),next)
  }


  // you can use processorOptions to override
  addModel(model, processorOptions){
    assert(this._phase === PHASE.runPlugin,"addModel can only called in run plugin phase")
    if(processorOptions){
       model._processorOptions = processorOptions
    }
    this.models[model.name] = model
    this._modelList.push(model)
  }

  addService(name, service){
    assert(this._phase === PHASE.runPlugin,"addService can only called in run plugin phase")
    this.services[name] = service
  }

  addModelProcessor(name, processor){
    assert(this._phase === PHASE.runPlugin,"addModelProcessor can only called in run plugin phase")
    
    // each time processor run, it will update the processor cursor
    let wrappedprocessor = (manager,model,next)=>{
      manager._processorCursor = wrappedprocessor._index
      processor(manager,model,next)
    }
    
    wrappedprocessor._plugin = this._currentRunningPlugin
    wrappedprocessor._localName = name
    // to make processor name only unique in each processor
    wrappedprocessor._name = `${this._currentRunningPlugin.info.name}:${name}`
    assert(!this._modelProcessorSet.has(wrappedprocessor._name),`[${wrappedprocessor._name}] already exists in plugin, you register it more than once`)
    this._modelProcessorSet.add(wrappedprocessor._name)
    // set the processor index
    wrappedprocessor._index = this.modelProcessors.length
    this.modelProcessors.push(wrappedprocessor)
  }

  addModelDynamically(model,processorOptions,next){
    this.models[model.name] = model
    this._modelList.push(model);
    
    // current, we add this model at the end of current layer processings
    let cursor = this._processorCursor
    this._currentLayerProcessing.push((next)=>{
      this.modelProcessors[cursor](this,model,next)
    })
    this.reprocessModel(model,processorOptions,next)
  }

   /**
    * helper method to update the given model
    * @param model
    * @param updateAction (Function|object) if object, it will merged into model, if Function it will called on model
    */
  updateModel(model,updateAction){
    if(typeof updateAction === "object"){
        _.merge(model,updateAction)
    }
    else if(typeof updateAction === "function"){
      updateAction.call(this,model)
    }
    else {
      assert(false,"updateAction should be object or function")
    }
  }


  reprocessModel(model,processorOptions,next){
    if(this._isInReprocess[model]){
       return next()
    }
    
    // store the current cursor, will use it to restore in the future
    let cursor = this._processorCursor
    this._isInReprocess[model] = true
    this._processSingleModel(model,processorOptions,cursor,(err)=>{
        if(err){
          next(err)
        }
        else {
          // restore the processor cursor
          this._processorCursor = cursor
          this._isInReprocess[model] = false
          next()
        }
    })
  }
  
  _processSingleModel(model,processorOptions, boundIndex,next){
    
    processorOptions = processorOptions || model._processorOptions
    let processeros = this.modelProcessors.slice(0,boundIndex)
    if(processorOptions){
      processeros = processeros.filter(p=>processorOptions[p._name])
    }
    processeros = processeros.map(p=>p.bind(null,this,model))
    helper.runCallbacksInSequence(processeros,next)
 }
  
 _processSingleLayerModel(processor,next){
    this._currentLayerCursor = 0
   this._currentLayerProcessing = this._modelList.filter(m=>(!m._processorOptions || m._processorOptions[processor._name])).map(
     model=>{
       return  (next)=>{
         this._currentLayerCursor++
         processor.call(null,this,model,next)
       }
     }
   )
   helper.runCallbacksInSequence(this._currentLayerProcessing,next)
 }
  

  meta(path, value){
    if(typeof value === "undefined"){
      return _.get(this._meta,path)
    }
    else {
      _.set(this._meta,path,value)
      return value
    }

  }

  get(path,defaultValue){
    return _.get(this,path,defaultValue)
  }

  set(path,value){
    _.set(this,path,value)
    return value
  }

}

module.exports = function createManager(options){
    return new Manager(options)
}

module.exports.utils = helper