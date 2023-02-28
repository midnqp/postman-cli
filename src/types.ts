/* eslint-disable @typescript-eslint/no-namespace */
import psdk from 'postman-collection'

export namespace PostmanCli.Cmd {
    export type ProgramOpts = {
        collection: string
        headers?: string
        variables?: string
    }
    export type VariadicResources = string[]
}

export namespace PostmanCli.Cmd.Opts {
    export type Show = {}
    export type List = { d: number }
    export type Run = {}
    export type Move = {
        from: Cmd.VariadicResources
        to: Cmd.VariadicResources
    }
    export type Rename = { name: string }
    export type Delete = { index: number }
    export type Reorder = { index: string }
}

export namespace PostmanCli {
    export type ResourceNames = 'request' | 'example' | 'folder'

    export type Resource = psdk.Item | psdk.ItemGroup<any> | psdk.Response

    export type Requestable = psdk.Request | psdk.Item | psdk.Response

    export type HttpPrintable = {
        headers: Record<string, unknown>
        params: Record<string, unknown>
        query: Record<string, unknown>
        url: {
            path: string
            method: string
        }
        body: unknown
    }

    export type ResponsePrintable = HttpPrintable & {
        size?: number
        time: number
        code: number
        status: string
        $parsedBody?: unknown
        $parseHint?: 'text' | 'json' | 'formdata' | 'wav' | 'png'
    }
}
