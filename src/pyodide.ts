import { tick } from "svelte"

enum State {
  nothing = -1;
  loading = 0;
  loaded = 1
}

const datasets = [
  {
    name: "sailors",
    csv: `sid,name,rating,age
1,Eugene,7,22
2,Luis,2,39
3,Ken,8,27`
  },
  {
    name: "boats",
    csv: `bid,name,color
101,Legacy,red
102,Melon,blue
103,Mars,red`
  },

  {
    name: "reserves",
    csv: `sid,bid,day
1,102,12
1,101,12
1,103,12
2,102,13
2,103,14`
  },
  {
    name: "data",
    csv: `a,b,c,d,e,f,g
0,0,0,0,a,2,c
1,1,1,0,b,4,d
2,2,0,0,c,6,e
3,3,1,0,d,8,cde
4,4,0,0,abc,10,a
5,0,1,0,cde,12,b
6,1,0,0,a,14,c
7,2,1,0,b,16,abc
8,3,0,0,c,18,c
9,4,1,0,d,20,d
10,0,0,0,abc,22,e
11,1,1,0,cde,24,cde
12,2,0,0,a,26,a
13,3,1,0,b,28,b
14,4,0,0,c,30,c
15,0,1,0,d,32,abc
16,1,0,0,abc,34,c
17,2,1,0,cde,36,d
18,3,0,0,a,38,e
19,4,1,0,b,40,cde`
  }
]

class Pyodide {
  pyodide;
  state;
  cbs = []
  constructor() {
    this.state = State.nothing;
  }

  onLoaded(cb) {
    this.cbs.push(cb)
  }

  async init(msgEl) {
    if (!this.state == State.nothing) return;
    if (this.pyodide) {
      this.state = State.loaded;
      return pyodide;
    }
    msgEl = msgEl ?? {};
    this.state = State.loading;

    msgEl.innerHTML = "(  0%) Loading Pyodide..";
    window.pyodide = this.pyodide = await loadPyodide();
    await tick()

    msgEl.innerHTML = "( 10%) Loading micropip..";
    await this.pyodide.loadPackage(["micropip"])
    await tick()

    msgEl.innerHTML = "( 20%) Loading pandas.."
    await this.pyodide.loadPackage(["pandas", "python-dateutil"])
    await tick()

    msgEl.innerHTML = "( 60%) Loading parsimonious wheel.."
    await this.pyodide.runPythonAsync(`
import pandas as pd
import io
import json
import micropip
await micropip.install("./parsimonious-0.9.0-py3-none-any.whl")
   `)
    await tick()

    msgEl.innerHTML = "( 80%) Loading databass wheel.."
   await this.pyodide.runPythonAsync(`
await micropip.install('./databass-0.0.1-py3-none-any.whl')
import databass 
from databass import *
db = Database.db()
    `)
    msgEl.innerHTML = "(100%) Ready!"
    this.state = State.loaded;
    this.loadDatasets()
    this.cbs.forEach((cb) => cb(this))
    return this.pyodide

  }

  loadDatasets() {
    datasets.forEach(({name,csv}) => {
      this.registerCSV(name,csv)
    })
  }
  
  schemas() {
    let schemas = this.pyodide.runPython(`
db = Database.db()
schemas = []
for name in db.tablenames:
  schema = [f"{a.aname} {a.typ}" for a in db.schema(name)]
  schemas.append([name, ", ".join(schema)])
json.dumps(schemas)
`)
    console.log("schemas", schemas)
    return JSON.parse(schemas)
  }

  registerCSV(name, csvstring) {
    self.pyodide.runPython(`
csv = """${csvstring}"""
data = pd.read_csv(io.StringIO(csv))
db.register_dataframe("${name}", data)
    `)
  }



  isLoaded() {
    return this.state == State.loaded;
  }
}

export let pyodide = new Pyodide()
