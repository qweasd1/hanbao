# Design


## Manager
* model
    * name
* service
    * name
* util
    * support merge utils
    * defaults
        * patternMatch
        * assert
    * currently we suppose util not rely on other util 
* plugins
    * info
    * <func>(manager,next)
    * utils
* modelProcessor: will run for all models 
    * filter: can have a filter function, so it will only apply to the target models
    * name: user can override or skip modelProcessor when they add models
    
    
* [not implement by now]serviceProcessor: will run for all service


### model register
* [!] addModel(model, processOptions) // when addModel is called during init phase, it will apply all previous model processors (exclusive the current one), which will recursive call other addModels, so we use stack here
    * we support this function here, because we hope some model can be added dynamically according to some conditions
* addService(service)
* addModelProcessor(processor,filter)
* [skip]addServiceProcessor(processor,filter)
* global(path[newValue])



### encapsulate
* plugins,models,modelProcessor can be array of other plugins, we will flattern them in the runtime


### run phase
* load utils from options
* load plugins and run them
* apply all modelProcessors in sequence to all the models
* finished

### debug
* add plugin load trace for nested plugins

### utils
* patternMatch
* get
* set

## Plugin design
* can add utils
* can add model & service
* can register model proecssor
* update global information
    * default datasource
* error 
    * current use next(error) to emit error and will add the error plugin to the error object
    * [TODO] 
        * what happened if error is string? // can't set plugin on it
        * [done] what if throw exception? (we need to try catch the run)
### Plugin model
* function
* info
    * name
* utils

### Plugin Use Case
* load models from project intelligently
* add basic query methods
* 


## Model processing design
* addModel can be add in runPlugins phase and runModelProcessing Phase
    * in runModelProcessing phase, if we also call addModel, model must run all previous model processing phase and then add to the run queue of all models waiting for run the current phase
    * this might result in recursively call of addModel
    * we can add a dynamically add model method to distinguish it from normal add, this method will return the newly created model and let you further processing it. we can set an option on it to let skip the current processor in the future
    * we can let people skip several model processing if they want
    
* we use addModelDynamic() to add model during modelProcess
    * how do you process the newly added model for the current layer? 
        * [current] we add it at the end of all models 
* we use reProcessModel() to re process a model immediately
* we use updateModel to helper method to update the given model
* [!] add debug support (the call path to the processor)
* the processorOptions design
    * can include
    * can exclude
    * can use pattern to match
    
* issue
    * if you reprocess a model, which has reprocess called in previous processor, it will again reprocess the previous processor, which result in previous reprocess might be called more than 1 time
        * [solution] when call reprocess, all nested reprocess for the same model is skipped