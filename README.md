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

Postman is a wondrous tool for backend developers. A friend. A single point of truth. Something that stays open alongside our code editor. However, using a graphical interface in a fast-moving work environment may not be productive. Most of us enjoy the most productivity with our keyboard, at our Terminal. So, why not bring Postman as a commandline interface? The project is pretty much in pre-release stage. Ideas/feedbacks are welcome!

Download for [Linux](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-linux.bin), [Mac](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-macos.tar.gz), or [Windows](https://github.com/MidnQP/postman-cli/releases/download/0.0.1/postman-cli-windows.exe) - and get started right away!


## CLI Options 
_Note: for brevity, a "resource" refers to a folder, request, or example within a Postman collection. An example of pinpointing a nested resource is `$ pcli show user register 200`. Here, `user` is a folder, `register` is a request, and `200` is an example. So, the command shows the details of the example named `200`._

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
  quickrun [resources...]           edit and run a request, without saving changes
  move [options]                    move a resource under another parent
  rename [options] <resources...>   rename a resource
  reorder [options] <resources...>  reorder a resource under the same parent
  add [options]                     adds a new resource
  update <resources...>             update a resource
  delete <resources...>             remove a resource
  env                               manage environment variables
  search [options] <resources...>   searches by name of resource
  help [command]                    display help for command
```
