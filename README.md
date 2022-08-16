<p align=center>
<img src="https://user-images.githubusercontent.com/50658760/179565718-d6bed09d-86f8-4096-bcd8-03b610cd5624.png"/>

<img src="https://badges.aleen42.com/src/node_flat_square.svg">
&emsp;
<img src="https://badges.aleen42.com/src/cli_flat_square.svg">
&emsp;
<img src="https://badges.aleen42.com/src/npm_flat_square.svg">
&emsp;

<img height=20px src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=for-the-badge">
&emsp;
<img height=20px src="https://img.shields.io/github/languages/code-size/midnqp/postman-cli?style=for-the-badge">
</p>

## :rocket: Origin
Postman is a wondrous tool for backend developers. A friend. A single point of truth. Something that stays open alongside our code editor. However, using a graphical interface in a fast-moving work environment may not be productive. Most of us enjoy the most productivity with our keyboard, at our Terminal. So, why not bring Postman as a commandline interface? The project is pretty much in pre-release stage. Ideas/feedbacks are welcome!

The prime use-case is to work with a postman collection from a command-line.

Download for [Linux](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-linux.bin), [Mac](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-macos.tar.gz), or [Windows](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-windows.exe) - and get started right away!

## CLI Options 
For the purpose of brevity, a "resource" refers to a folder/request/example within a Postman collection. An example of pinpointing a nested resource is `$ pcli show user register 200`. Here, `user` is a folder, `register` is a request, and `200` is an example. So, the command shows the details of the example named `200`.

The `.env.example` file can be configured to specify a collection.

Postman CLI commands:
- [list](#list-options-resources)
- [show](#show-options-resources)
- [run](#run-options-resources)
- [add](#add-options-resources)
- [mv](#mv-options-resources)
- [search](#search-options-resources)
- [list:edit](#listedit-options-resources)
- [show:edit](#showedit-options-resources)
- [run:edit](#runedit-options-resources)

### `list [options] [resources...]`

List resources recursively.

Options:
- `-d [number]` `set recursive depth [1]`

```
$ pcli list user register
	R register
		E 200
		E 400
		E 404
```
```sh
$ pcli list -d 2 user
	F user
		R register
			E 200
			E 400
			E 404
		R get
		R list
		R update
		R remove
```


### `show [options] [resources...]`

Shows details of a resource.

Options:
- `--res` `include response`
- `--meta` `include response meta`

```sh
$ pcli show --res --meta users register 200	# example

register post /users/register
{
  query: {
    '$fields': 'id,fullName'
  },
  body: {
    fullName: 'Muadh Bin Jabaal',
    userName: 'muadh'
    password: 'password'
  },
  response: {
    code: 200,
    status: 'OK',
    size: '59 bytes',
    time: '70ms',
    header: { etag: 'W/"2e0-BhmP8Tg7Unp53FgyRTXTNA2zjFU"' },
    body: {
      id: '7a96cbb8045a56d23dc1',
      fullName: 'Muadh bin Jabal'
    }
  }
}
```
```sh
$ pcli show users		# folder

register post /users/register
{
  query: {
    '$fields': 'id,fullName'
  },
  body: {
    fullName: 'Muadh Bin Jabaal',
    userName: 'muadh',
    language: [
      'c++',
      'carbon'
    ],
    password: 'password'
  }
}

login post /users/login
{ body: { userName: 'muadh', password: 'password' } }

update put /users/:id
{ params: { id: null } }

list get /users/:id
{ params: { id: null }, query: { '$fields': 'id,fullName' } }

remove delete /users/:id
{ params: { id: null } }
```



### `run [options] [resources...]`
TODO Run a request, using request data from a single request/example. Outputs response.

Options:
- `--meta` `include response meta`
- `--header` `include response header`
```sh
$ pcli run --meta --header users register
{
  code: 200,
  status: 'OK',
  size: '59 bytes',
  time: '70ms',
  header: { etag: 'W/"2e0-BhmP8Tg7Unp53FgyRTXTNA2zjFU"' },
  body: {
      id: '7a96cbb8045a56d23dc1',
      fullName: 'Muadh Bin Jabaal'
  }
}
```


###  `add [options] [resources...]`
TODO Adds a resource.
```sh
$ pcli add users		# adds request to folder
{
  name: 'update',
  url: {
    method: 'PUT',
    path: '/users/:user_id'
  },
  params: { id: '7a96cbb8045a56d23dc1' },
  query: { $fields: 'id,fullName' },
  body: { fullName: 'Muadh Bin Jabaal' }
}
```



### `show:edit [options] [resources...]`
TODO Edit details of a single resource. 
```
$ pcli show:edit --res users register
{
  name: 'register',
  url: { 
    method: 'PUT',
    path: '/users/:user_id'
  },
  params: { id: '7a96cbb8045a56d23dc1' },
  query: { $fields: 'id,fullName' },
  body: { fullName: 'Muadh Bin Jabaal' },
  response: {
    code: 200,
    status: 'OK',
    size: '59 bytes',
    time: '70ms',
    body: {
        id: '7a96cbb8045a56d23dc1',
        fullName: 'Muadh Bin Jabaal'
    }
  }
}
```



### `list:edit [options] [resources...]`
Rearranges, moves, renames a resource recursively.
```
$ pcli list:edit
- user
  - register
    - ibrahim
    - saad
    - muadh 
  - list
    - sorted
    - search
  - get
  - update
  - remove
```



### `run:edit [options] [resources...]`
TODO Run a request, after editing request data. Changes are not saved.
```
$ pcli run:edit user register
```
