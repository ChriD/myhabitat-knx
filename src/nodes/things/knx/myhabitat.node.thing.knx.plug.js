"use strict"

const MyHabitatNode_Thing_KNX   = require('./myhabitat.node.thing.knx.js')


module.exports = function(RED) {

  class MyHabitatNode_Thing_KNX_Plug extends MyHabitatNode_Thing_KNX
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
                isOn        : false
              }
    }


    input(_message)
    {
      super.input(_message)

      const payload = _message.payload

      switch(typeof payload)
      {
        case "number" :
          _message.state.isOn = payload > 0 ? true : false
          break
        case "boolean":
          _message.state.isOn = payload === true ? true : false
          break
        case "string":
          if(payload.toUpperCase() === "TOGGLE")
            _message.state.isOn = this.state().isOn ? false : true
          break
      }

      // apply the state object which was given by the input or which was created from
      // the above code to the physical device
      if(_message.state)
      {
        if(_message.state.isOn)
          this.turnOn()
        if(!_message.state.isOn)
          this.turnOff()
      }

    }


    ready()
    {
      super.ready()

      // register the feedback GA's for the state of the plug
      if(this.config.gaFeedbackOnOff)
        this.observeGA(this.config.gaFeedbackOnOff, 'DPT1.001')
    }


    gaReceived(_ga, _value, _data)
    {
      super.gaReceived(_ga, _value)

      // if we have received a feedback ga, we have to set the appropriate state
      switch(_ga)
      {
        case this.config.gaFeedbackOnOff:
          this.state().isOn = _value
          break
      }

      this.updateNodeInfoStatus()
    }


    turnOn()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 1)
    }


    turnOff()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 0)
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = this.state().isOn ? "ON" : "OFF"
      let infoFill = this.state().isOn ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }

  }


  RED.nodes.registerType('myhabitat-thing-knx-plug', MyHabitatNode_Thing_KNX_Plug)

}
