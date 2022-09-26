<script lang="ts">

  import { tick, onMount } from "svelte"
  import QueryPlan from "./QueryPlan.svelte"
  import LineageDiagram from "./LineageDiagram.svelte"
  import * as foo from "./assets/lineage.json"
  import { lineageData, selectedOpids } from "./stores.ts"
  import { pyodide } from "./pyodide"

  let msgEl = document.getElementById("msg");
  let queryParams = new URLSearchParams(window.location.search)
  $lineageData = foo;

  let errmsg = null;
  let qplanEl;
  let editorEl;
  let csvEl;
  let permalink = "";
  let q = queryParams.get("q") ?? `SELECT a, sum(b+2) * 2 as c 
FROM data, (SELECT 1 as x FROM data) AS d2 
WHERE data.a = d2.x
GROUP BY a`;
  let csv = queryParams.get("csv") ?? `a,b,c,d,e,f,g
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

  $: {
    permalink = `https://cudbg.github.io/sqltutor/?q=${encodeURI(q)}&csv=${encodeURI(csv)}`;
  }

  function getQueryLineage(q) {
    let code = `json_str_for_vis("""${q}""")`
    console.log(code)
    try {
      let lineageJson = pyodide.pyodide.runPython(code)
      let ret = JSON.parse(lineageJson)
      $: errmsg = null;
      return ret;
    } catch(e) {
      $: errmsg = e;
    }
  }


  function onSQLSubmit(){
    pyodide.pyodide.runPython(`
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

  function reportBug() {
    
  }


</script>

<style>
  textarea.editor {
    width: 100%;
    min-height: 20em;
    border: 1px solid black;
  }
  textarea {
    font-family: monospace;
  }
  .loading {
    text-align: center;
    padding: 10em;
    display: none;
  }
  .viscontainer,.errcontainer {
    margin-top: 3em;
  }
  small {
    font-size: 0.5em;
  }
  small input {
    font-size: 0.9em;
    margin-left: .5em;
    color: grey;
  }
  .alert {
    white-space: pre;
  }
  a:hover {
    background: var(--bs-highlight-bg);
  }
</style>




<main class="container">
  <h1>
    SQL Execution Visualizer 
    <small class="text-muted">
      permalink
      <input type="text" bind:value={permalink} style="width:20em;"/>
    </small>
  </h1>
  <div class="row">
    <div class="col-md-4">
      <h3>About</h3>
      <p>
      Visualizes each operator in the SQL query plan.  
      Click on an operator to visualize its input and output tables, along with their row/column dependencies (called <a href="https://arxiv.org/abs/1801.07237">data provenance</a>) .  
      </p>

      <p>
      We can only visualize simple queries over the <mark>data</mark> table.  
      The <mark>data</mark> table is loaded from the <mark>CSV</mark> textarea.  
      The CSV should include a header row.
      </p>

      <p> Use <mark>&leftarrow;</mark> and <mark>&rightarrow;</mark> to visualize the prev/next operator.  </p>

      <p style="font-size:smaller;">
        Implemented using the instructional 
        <a href="https://github.com/w6113/databass-public">Databass query compilation engine</a>
        developed for <a href="https://w6113.github.io">Columbia's COMS6113 Topics in Database Research</a>.  Table visualizer borrowed from <a href="https://pandastutor.com/">pandastutor</a>
      </p>
      <p style="font-size: smaller;">
        If the query should visualize but doesn't, or if there is an unexpected error, submit a
        <a target="_blank" href={`https://docs.google.com/forms/d/e/1FAIpQLSeqdk3ZqQms92iaGq5rKV6yUdnhLcRllc8igQPl1KGUwfCEUw/viewform?usp=pp_url&entry.351077705=${encodeURI(q)}&entry.1154671727=${encodeURI(csv)}&entry.1900716371=${encodeURI(errmsg)}`} class="link">report bug</a>
      </p>
    </div>

    {#await pyodide.init(msgEl)}
    <div class="col-md-4">
      <h3>SQL</h3>
      <textarea class="editor" disabled bind:value={q} />
      <button class="btn btn-secondary" disabled style="width:100%;">Loading libraries...</button>
    </div>
    <div class="col-md-4">
      <h3>CSV<small class="text-muted">stored in <mark>data</mark> table.</small> </h3>
      <textarea class="editor" disabled bind:value={csv} />
    </div>
    {:then}
    <div class="col-md-4">
      <h3>SQL</h3>
      <textarea class="editor" id="q" bind:this={editorEl} bind:value={q} />
      <button class="btn btn-primary" on:click={onSQLSubmit} style="width:100%;">Visualize Query</button>
    </div>
    <div class="col-md-4">
      <h3>CSV</h3>
      <textarea class="editor" id="csv" bind:this={csvEl} bind:value={csv} />
    </div>
    {/await}


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
    {#if errmsg}
    <div class="row errcontainer">
      <div class="col-md-12">
        <div class="alert alert-danger" role="alert">
          <h3>
            Could Not Parse Query <small><a target="_blank" href={`https://docs.google.com/forms/d/e/1FAIpQLSeqdk3ZqQms92iaGq5rKV6yUdnhLcRllc8igQPl1KGUwfCEUw/viewform?usp=pp_url&entry.351077705=${encodeURI(q)}&entry.1154671727=${encodeURI(csv)}&entry.1900716371=${encodeURI(errmsg)}`} class="link">report bug</a></small>
          </h3>
          {errmsg}
        </div>
      </div>
    </div>
    {/if}


</main>


