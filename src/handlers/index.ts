import cmdShow from '@src/handlers/show.js'
import cmdRename from '@src/handlers/rename.js'
import cmdList from '@src/handlers/list.js'
import cmdReorder from '@src/handlers/reorder.js'
import cmdMove from '@src/handlers/move.js'
import cmdDelete from '@src/handlers/delete.js'
import cmdRun from '@src/handlers/run.js'

export class Handlers {
    show = cmdShow
    run = cmdRun
    list = cmdList
    rename = cmdRename
    reorder = cmdReorder
    move = cmdMove
    delete = cmdDelete
}

export default new Handlers()
