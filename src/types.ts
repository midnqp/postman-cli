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
    export type List = { depth: number }
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

    export type Containable = psdk.Collection | psdk.ItemGroup<any> | psdk.Item

    export type HttpPrintable = {
        headers: Record<string, unknown>
        params: Record<string, unknown>
        query: Record<string, unknown>
        url: {
            path: string
            method: string
        }
        body: unknown
        'global:headers'?: Record<string, string>
        'global:variables'?: Record<string, string | number>
    }

    export type ResponsePrintable = {
        url: { path: string; method: string }
        headers: Record<string, unknown>
        body: unknown
        size: { body: number; header: number; total: number }
        time: number
        code: number
        status: string
        $parsedBody?: unknown
        $parseHint?: 'text' | 'json' | 'formdata' | 'wav' | 'png'
    }
}
