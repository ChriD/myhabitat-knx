"use strict"

const MyHabitatNode_Thing_KNX   = require('./myhabitat.node.thing.knx.js')


module.exports = function(RED) {

  class MyHabitatNode_Thing_KNX_Blind extends MyHabitatNode_Thing_KNX
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
                position    : 0,
                degree      : 0
              }
    }


    input(_message)
    {
      const payload = _message.payload

      /*
      // be sure we always have a state object for further processing
      if(!_message.state)
        _message.state = {}

      switch(typeof payload)
      {
        // a number is representating a brightness value
        case "number" :
          _message.state.isOn = payload > 0 ? true : false
          break
        // a boolean tells us if the lamp should be on or off
        case "boolean":
          _message.state.isOn = payload === true ? true : false
          break
        // and we may have some special actions which are representated as strings
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
      */

    }


    ready()
    {
      super.ready()

      if(this.config.gaFeedbackBlindPosition)
        this.observeGA(this.config.gaFeedbackBlindPosition, 'DPT5.001')
      if(this.config.gaFeedbackBlindDegree)
        this.observeGA(this.config.gaFeedbackBlindDegree, 'DPT5.001')
    }


    gaReceived(_ga, _value, _data)
    {
      super.gaReceived(_ga, _value)

      switch(_ga)
      {
        case this.config.gaFeedbackBlindPosition:
          this.state().position = _value
          break
        case this.config.gaFeedbackBlindDegree:
          this.state().degree = _value
          break
      }

      this.updateNodeInfoStatus()
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = "Pos.:" + (this.state().position).toString() + "% / Deg.: " + (this.state().degree).toString() + "%"
      let infoFill = this.state().position ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }

  }


  RED.nodes.registerType('myhabitat-thing-knx-blind', MyHabitatNode_Thing_KNX_Blind)

}
