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

      this.positioningIntervalId  = 0
      this.positioningInterval    = 1000
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
      super.input(_message)

      const self    = this
      const payload = _message.payload

      switch(typeof payload)
      {
        // a number is representating the position of the blind
        case "number" :
          _message.state.position = payload
          break
      }

      self.setPositionAndDegree(_message.state.position, _message.state.degree).catch(function(_exception){
        self.error(_exception.toString())
      })
    }


    ready()
    {
      const self = this

      super.ready()

      if(self.config.gaFeedbackBlindPosition)
        self.observeGA(self.config.gaFeedbackBlindPosition, 'DPT5.001')
      if(self.config.gaFeedbackBlindDegree)
        self.observeGA(self.config.gaFeedbackBlindDegree, 'DPT5.001')

      self.adapterNode().on('connectionStateChanged', function(_connected){
        if(_connected)
        {
          // be sure the feedback is activated.There are some actors which we do have to set a GA to get
          // position change responses and to get corrcet updated return values while moving the blinds
          if(self.config.gaFeedbackEnabled)
          self.sendGA(self.config.gaFeedbackEnabled, 'DPT1.001', 1)
        }
      })
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


    setPositionAndDegree(_position, _degree)
    {
      const self = this

      return new Promise((_resolve, _reject) => {
        // if any intervalls are running from prior actions we do clear them
        self.clearIntervals()

        // first set the position and if the position was reached trigger the degree
        self.setPosition(_position).then(function(){
          self.setDegree(_degree).then(function(){
            _resolve()
          }).catch(function(_exception){
            self.clearIntervals()
            _reject(_exception)
          })
        }).catch(function(_exception){
          self.clearIntervals()
          _reject(_exception)
        })
      })
    }


    setDegree(_degree)
    {
      const self = this

      return new Promise((_resolve, _reject) => {
        var elapsedTime     = 0
        var elapsedIdleTime = 0
        var oldPosition     = -1

        // be sure we do not exceed the values 0-100
        _degree   =  Math.min(_degree, 100)
        _degree   =  Math.max(_degree, 0)

        // no need to do anything if we are in the correct degree
        if(self.state().degree == _degree)
        {
          _resolve()
          return
        }

        // send the command to move to a specific degree (0-100%)
        self.sendGA(self.config.gaActionBlindDegree, 'DPT5.001', _degree)
        // if the feedback ga's are enabled we wait until we have reached the position
        self.positioningIntervalId = setInterval(function(){
          if(self.state().degree == _degree)
          {
            self.clearIntervals()
            _resolve()
          }
          // due to some bad behaviours of KNX blind/shutter actors we have to force a read of the feedback ga
          // for.eg. the Griesser MX is not able to send the last degree if we use "send while moving" (only 5% steps are triggered)
          self.readGA(self.config.gaFeedbackBlindDegree, 'DPT5.001')

          // if we have not reached the degree in a period of time (timeout) we do reject
          if(oldPosition == self.state().position)
            elapsedIdleTime += self.positioningInterval
          oldPosition == self.state().position

          elapsedTime += self.positioningInterval
          if(elapsedIdleTime >= 5000 || elapsedTime >= 60000)
          {
            self.clearIntervals()
            _reject(new Error("setDegree timout reached!"))
          }
        }, self.positioningInterval)

      })
    }


    setPosition(_position)
    {
      const self = this

      return new Promise((_resolve, _reject) => {
        var elapsedTime     = 0
        var elapsedIdleTime = 0
        var oldPosition     = -1

        // be sure we do not exceed the values 0-100
        _position =  Math.min(_position, 100)
        _position =  Math.max(_position, 0)

        // no need to do anything if we are in the correct position
        if(self.state().position == _position)
        {
          _resolve()
          return
        }

        // send the command to move to a specific position (0-100%)
        self.sendGA(self.config.gaActionBlindPosition, 'DPT5.001', _position)
        // if the feedback ga's are enabled we wait until we have reached the position
        self.positioningIntervalId = setInterval(function(){
          if(self.state().position == _position)
          {
            self.clearIntervals()
            _resolve()
          }
          // due to some bad behaviours of KNX blind/shutter actors we have to force a read of the feedback ga
          // for.eg. the Griesser MX is not able to send the last position if we use "send while moving" (only 5% steps are triggered)
          self.readGA(self.config.gaFeedbackBlindPosition, 'DPT5.001')

          // if position does not change anymore then we will timout in 5 seconds
          if(oldPosition == self.state().position)
            elapsedIdleTime += self.positioningInterval
          oldPosition == self.state().position

          elapsedTime += self.positioningInterval
          if(elapsedIdleTime >= 5000 || elapsedTime >= 60000)
          {
            self.clearIntervals()
            _reject(new Error("setPosition timout reached!"))
          }
        }, self.positioningInterval)

      })
    }


    clearIntervals()
    {
      if(this.positioningIntervalId)
        clearInterval(this.positioningIntervalId)
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
