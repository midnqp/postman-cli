import psdk from 'postman-collection'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types'

export class ResourceService {
    print(resource: PostmanCli.Resource) {
        if (services.folder.isFolder(resource)) {
            const r = resource
            r.forEachItem(e => services.request.print(e.request))
        } else if (services.item.isItem(resource)) {
            services.request.print(resource.request)
        } else if (services.response.isResponse(resource)) {
            services.response.print(resource)
        }
    }

    setParent(item: PostmanCli.Resource, newparent: PostmanCli.Containable) {
        const isCol = services.collection.isCollection
        const isFol = services.folder.isFolder
        const isReq = services.item.isItem
        const isRes = services.response.isResponse

        if (isCol(item)) {
            services.logger.error('cannot move collection')
            return
        }

        const itemType = services.resource.getType(item)

        const oldparent: any = item.parent()
        if (!oldparent) {
            const err = `parent of ${itemType} '${item.name}' not found`
            services.logger.error(err)
            return
        }

        //let refAdd, refRemove
        //if (isFol(newparent) || isCol(newparent)) refAdd = newparent.items
        //else refAdd = newparent.responses
        const refAdd = services.resource.getChildren(newparent)
        const refRemove = services.resource.getChildren(oldparent)

        //if (
        //services.folder.isFolder(oldparent) ||
        //services.collection.isCollection(oldparent)
        //)
        //refRemove = oldparent.items
        //else if (services.item.isItem(oldparent))
        //refRemove = oldparent.responses

        const isSameParent = oldparent.id == newparent.id
        //const isSameName = oldparent.name == newparent.name
        //if (!isSameName) item.name = newparent.name
        if (!isSameParent) {
            refAdd.add(item)
            refRemove.remove(item.id, null)
        }
    }

    isResource(item): item is PostmanCli.Resource | psdk.Collection {
        return (
            services.folder.isFolder(item) ||
            services.item.isItem(item) ||
            services.response.isResponse(item) ||
            services.collection.isCollection(item)
        )
    }

    isContainable(resource): resource is PostmanCli.Containable {
        return (
            services.folder.isFolder(resource) ||
            services.item.isItem(resource) ||
            services.collection.isCollection(resource)
        )
    }

    getChildrenRaw(parent: PostmanCli.Containable) {
        const isColl = services.collection.isCollection(parent)
        const isFolder = services.folder.isFolder(parent)
        if (isFolder || isColl) return parent.items.all()
        else return parent.responses.all()
    }

    getChildren(parent: PostmanCli.Containable) {
        const isColl = services.collection.isCollection(parent)
        const isFolder = services.folder.isFolder(parent)
        if (isFolder || isColl) return parent.items
        else return parent.responses
    }

    getById(arr, id) {
        const cb = data => data.item.id == id
        return services.traverse.deepFirst(arr, cb)
    }

    getByName(arr, name) {
        const cb = data => data.item.name == name
        return services.traverse.deepFirst(arr, cb)
    }

    /**
     * postman folder  -> psdk.ItemGroup
     * postman example -> psdk.Response
     * postman request -> psdk.Item
     */
    getType(
        resource: PostmanCli.Resource
    ): PostmanCli.ResourceNames | 'collection' {
        if (services.collection.isCollection(resource)) return 'collection'
        else if (services.folder.isFolder(resource)) return 'folder'
        else if (services.item.isItem(resource)) return 'request'
        else return 'example'
    }

    getIcon(resource: PostmanCli.Resource | psdk.Collection): string {
        const type = this.getType(resource)
        const icons: Record<PostmanCli.ResourceNames | 'collection', string> = {
            collection: services.collection.getIcon(),
            folder: services.folder.getIcon(),
            request: services.request.getIcon(),
            example: services.response.getIcon(),
        }
        return icons[type]
    }

    printOutline(parent, opts = {}) {
        const cb = next => {
            const { item } = next
            let d = next.currDepth
            // reached to the last i.e. an example
            if (services.response.isResponse(item)) d++
            const icon = this.getIcon(item)
            const out = ['    '.repeat(d), icon, item.name].join(' ')
            services.logger.out(out)
        }

        services.traverse.deepFirst(parent, cb, opts)
    }
}

export default new ResourceService()
