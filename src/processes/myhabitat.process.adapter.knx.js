
'use strict'

const MyHabitatProcess      = require('myhabitat').MyHabitatProcessAdapter
const MyHabitatAdapter_KNX  = require('../adapters/myhabitat.adapter.knx.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_KNX(MyHabitatProcess.getEntityIdFromArgs(process.argv)))

