import { tick } from "svelte"

enum State {
  nothing = -1;
  loading = 0;
  loaded = 1
}

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
    return this.pyodide

  }

  isLoaded() {
    return this.state == State.loaded;
  }
}

export let pyodide = new Pyodide()
