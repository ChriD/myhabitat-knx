"use strict"

const MyHabitatNode_Thing_KNX   = require('./myhabitat.node.thing.knx.js')


module.exports = function(RED) {

  class MyHabitatNode_Thing_KNX_PresenceDetector extends MyHabitatNode_Thing_KNX
  {
    constructor(_config)
    {
      super(RED, _config)
      RED.nodes.createNode(this, _config)
      this.created()
    }


    getDefaultState()
    {
      return  {
                presence : false
              }
    }


    input(_message)
    {
      // we do not have any input here
    }


    ready()
    {
      super.ready()

      if(this.config.gaFeedbackPresence)
        this.observeGA(this.config.gaFeedbackPresence, 'DPT1.001')
    }


    gaReceived(_ga, _value, _data)
    {
      super.gaReceived(_ga, _value)

      switch(_ga)
      {
        case this.config.gaFeedbackPresence:
          if(this.state().presence != _value)
            this.send({ payload : _value })
          this.state().presence = _value
          break
      }


      this.updateNodeInfoStatus()
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = this.state().presence ? "Presence detected" : "No presence"
      let infoFill = this.state().presence ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }

  }


  RED.nodes.registerType('myhabitat-thing-knx-presencedetector', MyHabitatNode_Thing_KNX_PresenceDetector)

}
