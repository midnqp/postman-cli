import psdk from 'postman-collection'

const _any = {} as any
export const _resourcedetails_ = { headers: _any, params: _any, query: _any, body: _any, url: { path: '', method: '' } }
export type PcliResourceDetails = typeof _resourcedetails_
export type PcliRequestable = psdk.Request | psdk.Item | psdk.Response
export type PcliResource = psdk.Item | psdk.ItemGroup<any> | psdk.Response


export namespace PcliOpts {
	export type PcliResourceOr = 'request' | 'example' | 'folder'
	export type CmdVariadicResources = string[]
	/** `headers` and `variables` are json strings. */
	export type ProgramOpts = {
		collection: string
		headers?: string
		variables?: string
	}
	export type CmdShowOpts = {
		res?: true
		info?: true
		nocompact?: true
		hide?: string
		hl?: string
	}
	export type CmdListOpts = { d: number }
	export type CmdRunOpts = {
		req?: true
		info?: true
	}
	export type CmdMoveOpts = {
		from: CmdVariadicResources
		to: CmdVariadicResources
	}
	export type CmdRenameOpts = { name: string }
	export type CmdDeleteOpts = { index: number }
	export type CmdReorderOpts = {index:string}
	export type CmdAddOpts = {
		t: PcliResourceOr
		name: string
		parent: CmdVariadicResources
		index?: string
	}
	export type CmdSimpleOpts = {
		url?: string
		method?: string
		data?: string
		headers?: string
	}
	export type CmdSearchOpts = { t: PcliResourceOr }
	export type CmdAddRequestInput = {
		body: string
		method: 'get' | 'post' | 'put' | 'delete'
		url: string
		type: string
		headers: string
		query: string
		pathvar: string
	}
}
