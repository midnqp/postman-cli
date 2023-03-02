import chalk from 'chalk'
import psdk from 'postman-collection'

export class FolderService {
    isFolder(value): value is psdk.ItemGroup<any> {
        return psdk.ItemGroup.isItemGroup(value)
    }

    getIcon() {
        return chalk.italic.magenta(' fol ')
    }
}

export default new FolderService()
