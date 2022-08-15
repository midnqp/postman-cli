
<p align=center>
<img src="https://user-images.githubusercontent.com/50658760/179565718-d6bed09d-86f8-4096-bcd8-03b610cd5624.png"/>
</p>

## Origin
Postman is a wondrous tool for backend developers. A friend. A single point of truth. Something that stays open alongside our code editor. However, using a graphical interface in a fast-moving work environment may not be productive. Most of us enjoy the most productivity with our keyboard, at our Terminal. So, why not bring Postman as a commandline interface?

(The project is pretty much in pre-release stage. Ideas/feedbacks are welcome!)

```
Usage: pcli [options] [command]

postman command-line interface

Options:
  -v, --version                       output the version number
  -c, --collection <string>           path to collection
  -H, --headers <string>              header for all requests
  -V, --variables <string>            variable for all requests
  -h, --help                          display help for command

Commands:
  show <shows...>                     show details of a resource
  list [options] [resources...]       list resource heirarchy recursively
  run [runs...]                       runs a request
  run:edit [resources...]             edit and run a request
  list:edit [options] [resources...]  edit a list of resources
  search [resources...]               searches a resource
  help [command]                      display help for command
```

For the purpose of brevity, a "resource" refers to a folder/request/example under a Postman collection. An example of pinpointing a nested resource is `$ pcli show user register 200`. Here, `user` is a folder, `register` is a request, and `200` is an example.

The `.env` file can be used to specify a collection. 

### `list [options] [resources...]`

List resources recursively.

Options:
- `-d [number]  set recursive depth [1]`

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

```sh
$ pcli show --res users register			# request

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
    body: {
      id: '7a96cbb8045a56d23dc1',
      fullName: 'Muadh bin Jabal'
    }
  }
}
```
```sh
$ pcli show users			# folder

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
