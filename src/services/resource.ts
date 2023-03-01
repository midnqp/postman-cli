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

    setParent(item: PostmanCli.Resource, newParent) {
        if (services.collection.isCollection(item)) {
            services.logger.warn('cannot move collection to a new parent')
            return
        }

        const oldParent: any = item.parent()
        if (!oldParent)
            throw Error('parent of resource "' + item.name + '" not found')

        let refAdd, refRemove
        if (
            services.folder.isFolder(newParent) ||
            services.collection.isCollection(newParent)
        )
            refAdd = newParent.items
        else refAdd = newParent.responses

        if (
            services.folder.isFolder(oldParent) ||
            services.collection.isCollection(oldParent)
        )
            refRemove = oldParent.items
        else if (services.item.isItem(oldParent))
            refRemove = oldParent.responses

        const isSameParent = oldParent.id == newParent.id
        const isSameName = oldParent.name == newParent.name
        if (!isSameName) item.name = newParent.name
        if (!isSameParent) {
            refAdd.add(item)
            refRemove.remove(item.id)
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

    getChildren(parent, raw = true) {
        let result: any = []

        if (
            services.folder.isFolder(parent) ||
            services.collection.isCollection(parent)
        ) {
            result = parent.items
            if (raw) result = result.all()
        } else if (services.item.isItem(parent)) {
            result = parent.responses
            if (raw) result = result.all()
        } else if (!this.isResource(parent) && Array.isArray(parent.items))
            result = parent.items

        return result
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
