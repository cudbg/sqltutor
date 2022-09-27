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
1,"Eugene",7,22
2,'Luis',2,39
3,'Ken',8,27`
  },
  {
    name: "boats",
    csv: `bid,name,color
101,'Legacy','red'
102,'Melon','blue'
103,'Mars','red'`
  },

  {
    name: "reserves",
    csv: `sid,bid,day
1,102,12
1,101,12
1,103,12
2,102,13
2,103,14`
  }
]

class Pyodide {
  pyodide;
  state;
  constructor() {
    this.state = State.nothing;
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

    msgEl.innerHTML = "( 80%) Loading sql2pandas wheel.."
   await this.pyodide.runPythonAsync(`
await micropip.install('./databass-0.0.1-py3-none-any.whl')
import databass 
from databass import *
db = Database.db()
    `)
    msgEl.innerHTML = "(100%) Ready!"
    this.state = State.loaded;
    this.loadDatasets()
    return this.pyodide

  }

  loadDatasets() {
    datasets.forEach(({name,csv}) => {
      this.registerCSV(name,csv)
    })
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
