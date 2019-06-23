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


    ready()
    {
      const self = this
      super.ready()

      // be sure to send the initial value of the alive state of the knx process if status is already set by the process
      // otherwise the following event registration will trigger on change
      if(self.state().process)
        self.emit('processAliveStateChanged', self.state().process.alive)
      if(self.state().connection)
        self.emit('processAliveStateChanged', self.state().connection.connected)

      // it may be of advantage to know if the underlaying process has changed its alive state or it connection state
      // for e.g we have to re-add the observation GA's if the underlaying process crashed and was restarted by the watchdog
      self.appNode().on('entityStateChanged', function(_path, _value, _previousValue){
        if(_path === self.getEntityId() + '.state.process.alive')
          self.emit('processAliveStateChanged', _value)
        if(_path === self.getEntityId() + '.state.connection.connected')
          self.emit('connectionStateChanged', _value)
      })
    }

    adapterMessage(_adapterEntity, _data)
    {
      // we have retrieved KNX data, so we do emit a event where all KNX nodes are listening on
      // if there is relevant KNX data for the node it will proceed, so in fact every KNX node gets
      // every KNX data we are observing
      this.emit('knxMessage', _data)
    }


    observeGA(_ga, _dpt = 'DPT1.001', _initialRead = true)
    {
      if(!this.adapterProcess())
        this.error('Adapter process not available!')
      this.adapterProcess().send( {data : { action      : "observe",
                                            ga          : _ga,
                                            dpt         : _dpt,
                                            initialRead : _initialRead
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

    readGA(_ga, _dpt)
    {
      this.adapterProcess().send( {data : { action    : "read",
                                            ga        : _ga,
                                            dpt       : _dpt,
                                            options   : {},
                                          }
                                  })
    }

  }

  RED.nodes.registerType("myhabitat-adapter-knx", MyHabitatNode_Adapter_KNX)

}