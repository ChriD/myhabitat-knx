"use strict"

const MyHabitatNode_Adapter  = require('myhabitat').MyHabitatNode_Adapter
const AppRoot               = require('app-root-path')

module.exports = function(RED) {

  class MyHabitatNode_Adapter_KNX extends MyHabitatNode_Adapter
  {
    constructor(_config)
    {
      super(RED, _config)
      RED.nodes.createNode(this, _config)
      this.created()
    }


    getEntityModuleId()
    {
      return "KNX"
    }

    getEntityId()
    {
      return this.config.adapterId ? this.config.adapterId : "KNX01"
    }

    getAdapterProcessFile()
    {
      return AppRoot + '/src/processes/myhabitat.process.adapter.knx.js'
    }

    getAdapterConfiguration()
    {
      return { host : this.config.host , port : this.config.port, forceTunneling : this.config.forceTunneling }
    }

    adapterMessage(_adapterEntity, _data)
    {
      // we have retrieved KNX data, so we do emit a event where all KNX nodes are listening on
      // if there is relevant KNX data for the node it will proceed, so in fact every KNX node gets
      // every KNX data we are observing
      this.emit('knxMessage', _data)
    }

    observeGA(_ga, _dpt = 'DPT1.001')
    {
      if(!this.adapterProcess())
        this.error('Adapter process not available!')
      this.adapterProcess().send( {data : { action    : "observe",
                                            ga        : _ga,
                                            dpt       : _dpt,
                                            options   : {
                                                          dpt : _dpt
                                                        },
                                          }
                                  })
    }

    sendGA(_ga, _dpt, _value)
    {
      this.adapterProcess().send( {data : { action    : "write",
                                            ga        : _ga,
                                            value     : _value,
                                            dpt       : _dpt,
                                            options   : {},
                                          }
                                  })
    }

  }

  RED.nodes.registerType("myhabitat-adapter-knx", MyHabitatNode_Adapter_KNX)

}