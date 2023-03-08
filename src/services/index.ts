import cmdopts from '@src/services/cmdopts.js'
import collection from '@src/services/collection.js'
import common from '@src/services/common.js'
import folder from '@src/services/folder.js'
import item from '@src/services/item.js'
import logger from '@src/services/logger.js'
import request from '@src/services/request.js'
import resource from '@src/services/resource.js'
import traverse from '@src/services/traverse.js'
import response from '@src/services/response.js'
import env from '@src/services/env.js'
import example from '@src/services/example.js'

export class Services {
    cmdopts = cmdopts
    collection = collection
    common = common
    env = env
    folder = folder
    item = item
    logger = logger
    request = request
    resource = resource
    traverse = traverse
    response = response
    example = example
}

export default new Services()
