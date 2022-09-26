<script context="module" lang="ts">
  import { tick, onMount } from "svelte"

  let pyodide = null;
  let pyodideLoaded = false;
  let msgEl = document.getElementById("msg");

  async function initPyodide() {
    //pyodideLoaded = true;
    //return;
    if (pyodide && pyodideLoaded) return;
    msgEl.innerHTML = "(  0%) Loading Pyodide..";
    window.pyodide = pyodide = await loadPyodide();
    await tick()

    msgEl.innerHTML = "( 10%) Loading micropip..";
    await pyodide.loadPackage(["micropip"])
    await tick()

    msgEl.innerHTML = "( 20%) Loading pandas.."
    await pyodide.loadPackage(["pandas", "python-dateutil"])
    await tick()

    msgEl.innerHTML = "( 60%) Loading parsimonious wheel.."
    await pyodide.runPythonAsync(`
import pandas as pd
import io
import json
import micropip
await micropip.install("/parsimonious-0.9.0-py3-none-any.whl")
   `)
    await tick()

    msgEl.innerHTML = "( 80%) Loading sql2pandas wheel.."
   await pyodide.runPythonAsync(`
await micropip.install('/databass-0.0.1-py3-none-any.whl')
import databass 
from databass import *
db = Database.db()
    `)
    msgEl.innerHTML = "(100%) Ready!"
    $: pyodideLoaded = true;
  }


  function getQueryLineage(q) {
    let code = `json_str_for_vis("""${q}""")`
    console.log(code)
    let lineageJson = pyodide.runPython(code)
    return JSON.parse(lineageJson)
  }
</script>
<script lang="ts">

  import QueryPlan from "./QueryPlan.svelte"
  import LineageDiagram from "./LineageDiagram.svelte"
  import * as foo from "./assets/lineage.json"
  import { lineageData, selectedOpids } from "./stores.ts"

  $lineageData = foo;

  let qplanEl;
  let editorEl;
  let csvEl;
  let q = `SELECT a, sum(b+2) * 2 as c 
  FROM data, (SELECT 1 as x FROM data) AS d2 
  WHERE data.a = d2.x
  GROUP BY a`;
  let csv = `a,b,c,d,e,f,g
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
19,4,1,0,b,40,cde`;

  function onSQLSubmit(){
    pyodide.runPython(`
csv = """${csv}"""
data = pd.read_csv(io.StringIO(csv))
db.register_dataframe("data", data)
    `)
    $: {
      $lineageData = getQueryLineage(q)
    }
  }

  onMount(() => {
//    let opts = {
//        theme:"ace/theme/sqlserver",
//        readOnly: true,
//        minLines: 25 ,
//        showPrintMargin: false
//    }
//    sqlEditor = ace.edit(editorEl, opts)
//    sqlEditor.session.setMode("ace/mode/sql")
//    sqlEditor.resize();
//    csvEditor = ace.edit(csvEl, opts)
//    csvEditor.session.setMode("ace/mode/text")
//    csvEditor.resize()
  })


</script>

<style>
  textarea.editor {
    width: 100%;
    min-height: 20em;
    border: 1px solid black;
  }
  .loading {
    text-align: center;
    padding: 10em;
    display: none;
  }
  .viscontainer {
    margin-top: 3em;
  }
</style>

<svelte:head>
  <link rel="stylesheet" href="/src/assets/css/bootstrap.min.css"/>
  <script src="/src/assets/js/bootstrap.bundle.min.js" />
</svelte:head>




<main class="container">
  <h1>SQL Execution Visualizer</h1>

  <div class="row">
    <div class="col-md-4">
      <h3>About</h3>
      <p> An SQL query is turned into a Query Plan, a set of operations that transform the input data and together provide the final output. We illustrate how each operator in the query plan transforms the input data, so you can see step-by-step how the result gets constructed.  </p>
      <p>To start, put the input data and the SQL query you want to act on it, in the input section.  Then you can see what the final result is.  Below, you can see the query plan your query was turned into. Click on the operator nodes to see that operator's contribution, or click the button below it to see the entire query plan in action!  </p>
    </div>
    <div class="col-md-4">
      <h3>SQL</h3>
      <textarea class="editor" disabled={!pyodideLoaded} id="q" bind:this={editorEl} bind:value={q} />
      {#await initPyodide()}
        <!--<div class="loading"> Loading Databass DBMS </div>-->
        <button class="btn btn-secondary" disabled>Visualize Query</button>
      {:then}
        <button class="btn btn-primary" on:click={onSQLSubmit}>Visualize Query</button>
      {/await}
      {#if pyodideLoaded} {/if}
    </div>
    <div class="col-md-4">
      <h3>CSV data <small class="text-muted">header in first row</small> </h3>
      <textarea class="editor" disabled={!pyodideLoaded} id="csv" bind:this={csvEl} bind:value={csv} />
    </div>
  </div>


    {#if $lineageData}
    <div class="row viscontainer">
      <div class="col-md-4" bind:this={qplanEl}>
        <QueryPlan h={$lineageData.plan_depth*50+100}   />
      </div>
      <div class="col-md-8">
        <LineageDiagram opids={$selectedOpids}  />
      </div>
    </div>
    {/if}

</main>


