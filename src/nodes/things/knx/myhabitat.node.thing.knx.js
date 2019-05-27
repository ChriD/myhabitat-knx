"use strict"

const MyHabitatNode_Thing   = require('myhabitat').MyHabitatNode_Thing

class MyHabitatNode_Thing_KNX extends MyHabitatNode_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
    this.observedGA = {}
  }


  getEntityModuleId()
  {
    return "KNX"
  }

  created()
  {
    const self = this
    super.created()
  }


  ready()
  {
    const self = this
    super.ready()

     // be sure we get all messages the knx adapter was subscribed to listen to
    // those messages may not all belong to the specific node instance, so we have to filter out the appropriate KNX messages
    self.adapterNode().on('knxMessage', function(_data){
      if(self.observedGA[_data.destination])
        self.gaReceived(_data.destination, _data.value, _data)
    })

    // if the adapter process has been recreated for some reason we have to re-add all the observations of the current node
    // this is a crash scenario of the knx process which should not happen at all.
    // in fact this method will be called once on startup
    self.adapterNode().on('processAliveStateChanged', function(_data){
      const keys = Object.keys(self.observedGA)
      for(var idx=0; idx<keys.length; idx++)
      {
        self.observeGA(keys[idx], self.observedGA[keys[idx]].dpt)
      }
    })

    //TODO: Maybe call 'registerObservation??' method where all feedback datapoints have to be registered?
  }


  observeGA(_ga, _dpt = 'DPT1.001')
  {
    // KNX nodes have to tell the adapter which GA's they want to observe, due that the adapter does not distinguish
    // which node has observed what GA (and therfore senda all GA's to all KNX nodes) we have to store the observed GA
    // for the node locally
    this.adapterNode().observeGA(_ga, _dpt)
    this.observedGA[_ga] =  {
                              ga  : _ga,
                              dpt : _dpt
                            }
  }


  sendGA(_ga, _dpt, _value)
  {
    this.adapterNode().sendGA(_ga, _dpt, _value)
  }


  gaReceived(_ga, _value, _data)
  {
  }

}


module.exports = MyHabitatNode_Thing_KNX