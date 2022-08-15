<p align=center>
<img src="https://user-images.githubusercontent.com/50658760/179565718-d6bed09d-86f8-4096-bcd8-03b610cd5624.png"/>
</p>

## Origin
Postman is a wondrous tool for backend developers. A friend. A single point of truth. Something that stays open alongside our code editor. However, using a graphical interface in a fast-moving work environment may not be productive. Most of us enjoy the most productivity with our keyboard, at our Terminal. So, why not bring Postman as a commandline interface?

(The project is pretty much in pre-release stage. Ideas/feedbacks are welcome!)

## Usage
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


## Usage
Let's assume this Postman collection.
```
  ecommerce backend (collection)
    |-- user (folder)
    |     |-- register (request)
    |     |     |-- 200 (example)
    |     |     |-- 400
    |     |     `-- 404
    |     |-- get
    |     |-- list
    |     |-- update
    |     `-- remove
    `-- order
          |-- create
          |-- update
          |-- list
          |-- get
          |-- remove
          `-- checkout
```


### `list <nested resources...>`
Lists collection/folder/request recursively.
Option:
	- `-d`, type: `number`, set recursive depth

###### Collection
`$ pcli list`


###### Folder
`$ pcli list user`
```
	F user
			R register
			R get
			R list
			R update
			R remove
```

###### Request
`$ pcli list user register`
```
	R register
			E 200
			E 400
			E 404
```


### `show <nested resources...>`
Shows a folder/request/example.

For request:
`$ pcli show user register`
```
register post /users/register
{
  body: {
    fullName: 'Muadh Bin Jabal',
    userName: 'muadh'
    country: 'Arabia',
    password: 'password'
  }
}
```

For folder: 
```
Example: 200
POST /users/register?$fields=id,fullName
body: {
  fullName: 'Muadh bin Jabal',
  userName: 'muadh1'
  country: 'Zajiratul Arab',
  password: 'password'
}
response: {
  user: {
    id: '7a96cbb8045a56d23dc1',
    fullName: 'Muadh bin Jabal'
  }
}

Example: 400
POST /users/register
body: {
  fullName: 'Muadh bin Jabal',
  userName: 'muadh1'
}
response: {
  error: {
    code: 400,
    message: 'INVALID_ARGUMENT',
    details: [
      { message: 'Required fields: country, password.', in: 'body' }
    ]
```


```
$ pcli show user update self --with-res
PUT /users/:user_id
body: { fullName: 'Muadh Bin Jabaal' }
params: { user_id: '7a96cbb8045a56d23dc1' }
query: { $fields: 'id,fullName' }
200 OK
{
  user: {
    id: 7a96cbb8045a56d23dc1
    fullName: 'Muadh Bin Jabaal'
  }
}
```


```
$ pcli edit user update self --with-res
$ pcli edit 1 3 1 --with-res
export default {
  url: { 
    method: 'PUT',
    baseURL: '/users/:user_id'
  },
  body: { fullName: 'Muadh Bin Jabaal' }
  params: { user_id: '7a96cbb8045a56d23dc1' }
  query: { $fields: 'id,fullName' }
  response: {
    code: 200,
    status: 'OK',
    body: {
      user: {
        id: 7a96cbb8045a56d23dc1
        fullName: 'Muadh Bin Jabaal'
      }
    }
  }
}
```


```
$ pcli list:edit  # id in grey, for rename, and move, recursive
- user  b6c328436a6c00b08974
  - list  f4c6c3e7e3fd8b06e15c
    - list  6972e9e4b0cfdf251c9c
    - search  f0867f6c622d6ca94f97
  - get  93316b836165aa01958c
  - update
    - self
    - admin
  - register
    - ibrahim
    - saad
    - muadh
  - remove
    - self
    - admin
```


```
$ pcli list user update
  1. self
  2. admin
```


```
$ pcli show user list search
GET /users
query: {
  sort: 'createdAt',
  fullName: 'muadh',
  page: 2,
  limit: 10,
}
```


```
$ pcli search 'list'
4. user
  1. list
5. shop
  1. list
6. order
  1. list
```


```
$ pcli run:edit user update --with-meta
PUT /users/:user_id
params: { user_id: '7a96cbb8045a56d23dc1' }
body:  {
  fullName: 'Muhammad'
  email: 'midnqp@gmail.com',
  identity: 'Muslim'
}

70ms 1.1KB 200 OK
{
  etag: 'W/"2e0-BhmP8Tg7Unp53FgyRTXTNA2zjFU"'
}
{
  user: {
    id: 7a96cbb8045a56d23dc1
    fullName: 'Muadh Bin Jabaal'
  }
}
```

```
$ pcli create user register
export default {
  fullName: 'Muadh bin Jabal',
  userName: 'muadh1'
  country: 'Zajiratul Arab',
  password: 'password'
}
```
