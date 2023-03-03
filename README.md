<p align=center><img src="https://img.shields.io/badge/postman%20cli-an%20elegant%20command--line%20for%20postman%20collection-white?style=for-the-badge&logo=postman"></p><br><br>


<p align=center>
<!--img src="https://user-images.githubusercontent.com/50658760/179565718-d6bed09d-86f8-4096-bcd8-03b610cd5624.png"/-->
<img height=20px src="https://badges.aleen42.com/src/node_flat_square.svg">
&emsp;
<img height=20px src="https://badges.aleen42.com/src/cli_flat_square.svg">
&emsp;
<img height=20px src="https://badges.aleen42.com/src/npm_flat_square.svg">
&emsp;

<img height=20px src="https://img.shields.io/badge/License-MIT-brightgreen.svg?style=for-the-badge">
&emsp;
<img height=20px src="https://img.shields.io/github/languages/code-size/midnqp/postman-cli?style=for-the-badge">
&emsp;
<a href="https://github.com/midnqp/postman-cli/actions/workflows/build.yml">
<img height=20px src="https://img.shields.io/github/actions/workflow/status/MidnQP/postman-cli/build.yml?branch=main&logo=github&style=for-the-badge">
</a>
</p>

[Postman](https://www.postman.com) is a wondrous tool for backend developers. A friend. A single point of truth. Something that stays open alongside our code editor. However, using a graphical interface in a fast-moving work environment may not be productive. Most of us enjoy the most productivity with our keyboard, at our Terminal. So, why not bring Postman as a commandline interface? The project is pretty much in pre-release stage. Ideas/feedbacks are welcome!

Download for [Linux](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli), [Mac](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli-macos-x64), or [Windows](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli.exe) - and get started right away!


## Usage
Note: for brevity, a "resource" refers to a folder, request, or example within a Postman collection. An example of pinpointing a nested resource is `$ pcli show user register 200`. Here, `user` is a folder, `register` is a request, and `200` is an example. So, the command shows the details of the example named `200`.

```
Usage: pcli [options] [command]

postman command-line interface

Options:
  --version                         output the version number
  -c, --collection <string>         path to collection
  -h, --headers <string>            header for all requests
  -v, --variables <string>          variable for all requests
  --help                            display help for command

Commands:
  show [options] <resources...>     show details of a resource
  list [options] [resources...]     list resources recursively
  run [options] <resources...>      runs a request
  move [options]                    move a resource under another parent
  rename [options] <resources...>   rename a resource
  reorder [options] <resources...>  reorder a resource under the same parent
  delete <resources...>             remove a resource
  help [command]                    display help for command
```

## Getting Started
Download postman-cli for your platform: [Linux](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli), [Mac](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli-macos-x64), or [Windows](https://github.com/MidnQP/postman-cli/releases/download/0.0.3/pcli.exe). Then let's download/export an example collection, which we can experiment with. You can copy and save [this collection json](https://api.postman.com/collections/17618914-61ab9b2b-4d20-46fb-bf0e-2952a69aae1b?access_key=PMAT-01GP5G11PGPYX8TMMQJVTZ96AC) in a file named `collection.json`, or you have your own postman collection json file.

```
$ pcli -c collection.json list              # to print the outline of a collection
$ pcli -c collection.json list --depth 2    # outline depth can be modified

      col  pcli example
          fol  users
              req  register
              req  login
              req  update
              req  list
              req  remove
          fol  orders
              req  checkout
              req  list
              req  remove
```

```
$ pcli -c collection.json show users register muadh  # to print any folder/request/example
                                                   # here, it prints users -> register -> muadh
                                                   
200 OK
{
  url: { method: 'method', path: 'url' },
  headers: {
    date: 'Sun, 17 Jul 2022 17:34:51 GMT',
    server: 'Apache/2.4.48 (Ubuntu)',
    'content-length': '271',
    'keep-alive': 'timeout=5, max=100',
    connection: 'Keep-Alive',
    'content-type': 'text/html; charset=iso-8859-1'
  },
  body: {
    user: { id: '7a96cbb8045a56d23dc1', fullName: 'Muadh Bin Jabaal' }
  },
  size: { body: 82, header: 210, total: 292 },
  time: null
}
```
