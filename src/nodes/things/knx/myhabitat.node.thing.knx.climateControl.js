"use strict"

const MyHabitatNode_Thing_KNX   = require('./myhabitat.node.thing.knx.js')


module.exports = function(RED) {

  class MyHabitatNode_Thing_KNX_ClimateControl extends MyHabitatNode_Thing_KNX
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
                isOn                : false,
                mode                : 0,
                setTemperature      : 0,
                ambientTemperature  : 0,
                fanSpeed            : 0
              }
    }

    input(_message)
    {
      super.input(_message)

      const payload = _message.payload

      switch(typeof payload)
      {
        case "number" :
          _message.state.setTemperature = payload
          break
        case "boolean":
          _message.state.isOn = payload === true ? true : false
          break
      }

      // apply the state object which was given by the input or which was created from
      // the above code to the physical device
      if(_message.state)
      {
        if(_message.state.isOn && _message.state.isOn != this.state().isOn)
          this.turnOn()
        if(!_message.state.isOn && _message.state.isOn != this.state().isOn)
          this.turnOff()
        if(_message.state.setTemperature && _message.state.setTemperature != this.state().setTemperature)
          this.setTemperature(_message.state.setTemperature)
      }

    }


    ready()
    {
      super.ready()

      if(this.config.gaFeedbackOnOff)
        this.observeGA(this.config.gaFeedbackOnOff, 'DPT1.001')
      if(this.config.gaFeedbackSetTemperature)
        this.observeGA(this.config.gaFeedbackSetTemperature, 'DPT14.068')
      if(this.config.gaFeedbackAmbientTemperature)
        this.observeGA(this.config.gaFeedbackAmbientTemperature, 'DPT14.068')
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
        case this.config.gaFeedbackSetTemperature:
          this.state().setTemperature = _value
          break
        case this.config.gaFeedbackAmbientTemperature:
          this.state().ambientTemperature = _value
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

    setTemperature(_temperature)
    {
      this.sendGA(this.config.gaActionSetTemperature, 'DPT14.068', _temperature)
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = (this.state().setTemperature).toString() + " / " + (this.state().ambientTemperature).toString()
      let infoFill = this.state().isOn ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }

  }


  RED.nodes.registerType('myhabitat-thing-knx-climatecontrol', MyHabitatNode_Thing_KNX_ClimateControl)

}
