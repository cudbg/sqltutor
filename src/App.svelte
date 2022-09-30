<script lang="ts">

  import { tick, onMount } from "svelte"
  import QueryPlan from "./QueryPlan.svelte"
  import LineageDiagram from "./LineageDiagram.svelte"
  import Bug from "./Bug.svelte"
  import * as foo from "./assets/lineage.json"
  import { lineageData, selectedOpids } from "./stores.ts"
  import { pyodide } from "./pyodide"
  import {generateUUID} from "./guid"
  import { ConvexHttpClient } from "convex/browser";
  import clientConfig from "../convex/_generated/clientConfig";

  const convex = new ConvexHttpClient(clientConfig)
  window.convex = convex;
  const sessionID = generateUUID()
  const addStat = convex.mutation("addStat")



  let msgEl = document.getElementById("msg");
  let queryParams = new URLSearchParams(window.location.search)
  $lineageData = foo;

  let errmsg = null;
  let qplanEl;
  let editorEl;
  let csvEl;
  let permalink = "";
  let newTableName;
  let schemas = [];
  let q = queryParams.get("q") ?? `SELECT a, sum(b+2) * 2 as c 
FROM data, (SELECT a*b as x, c, d  FROM data) AS d2 
WHERE data.b = d2.x
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

  async function addTable() {
    if (newTableName) {
      try {
        pyodide.registerCSV(newTableName, csv)
      } catch(e) {
        $: errmsg = e;
      }
      newTableName = null;
      $: schemas = pyodide.schemas()
    } else {
      alert("New table needs a name!")
    }
  }

  function onSQLSubmit(){
    addStat(sessionID, q, csv, errmsg, false, null, null)
    $: {
      $lineageData = getQueryLineage(q)

    }
  }

  pyodide.onLoaded(() => {
  $: schemas = pyodide.schemas()
  })

  onMount(() => {
  })

  function reportBug(comment, email) {
    addStat(sessionID, q, csv, errmsg, true, comment, email)
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
  small .permalink {
    font-size: 0.9em;
    margin-left: .5em;
    color: grey;
  }
  a:hover {
    background: var(--bs-highlight-bg);
  }
  .schema {
    padding-left: 0px;
    list-style: none;
  }
  .schema li {
    margin-bottom: .5em;
  }


  .bd-callout {
    padding: 1.25rem;
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    background-color: var(--bd-callout-bg, var(--bs-gray-100));
    border-left: 0.25rem solid var(--bd-callout-border, var(--bs-gray-300));
  }

  .bd-callout-danger {
    --bd-callout-bg: rgba(var(--bs-danger-rgb), .075);
    --bd-callout-border: rgba(var(--bs-danger-rgb), .5);
  }

</style>

<Bug id="modalBug" reportBug={reportBug} />


<main class="container-xl">
  <h1>
    SQLTutor Visualizes Query Execution
  </h1>
  <div class="row">
    <div class="col-md-3">
      <h3>About</h3>
      <p>
      <strong>SQLTutor</strong> visualizes each operator in the SQL query plan.  
      Click on an operator to visualize its input and output tables, along with their row/column dependencies (called <a href="https://arxiv.org/abs/1801.07237">data provenance</a>) .  
      Use <mark>&leftarrow;</mark> and <mark>&rightarrow;</mark> to visualize the prev/next operator.  </p>


      <p>
      We can only visualize simple queries. 
      You can add new tables using the <mark>CSV</mark> textarea.  The CSV should include a header row.
      </p>


      <p style="font-size: smaller;">
      <!--<a target="_blank" href={`https://docs.google.com/forms/d/e/1FAIpQLSeqdk3ZqQms92iaGq5rKV6yUdnhLcRllc8igQPl1KGUwfCEUw/viewform?usp=pp_url&entry.351077705=${encodeURI(q)}&entry.1154671727=${encodeURI(csv)}&entry.1900716371=${encodeURI(errmsg)}`} class="link">Report a bug</a>. -->
      <a href="#" class="link" data-bs-toggle="modal" data-bs-target="#modalBug">Report a bug or feature request</a>. 
      <!--Want to help? Contact us!-->
      </p>
      <p class="text-muted" style="font-size: smaller">
        permalink
        <input type="text" class="permalink" bind:value={permalink} style="width:100%;"/>
      </p>
    </div>

    {#await pyodide.init(msgEl)}
    <div class="col-md-3">
      <h3>SQL</h3>
      <textarea class="editor" disabled bind:value={q} />
      <button class="btn btn-secondary" disabled style="width:100%;">Loading libraries...</button>
    </div>
    <div class="col-md-3">
      <h3>CSV</h3>
      <textarea class="editor" disabled bind:value={csv} />
      <button class="btn btn-secondary" disabled style="width:100%;">Loading libraries...</button>
    </div>
    <div class="col-md-3">
      <h3>Database</h3>
      Loading...
    </div>
    {:then}
    <div class="col-md-3">
      <h3>SQL</h3>
      <textarea class="editor" id="q" bind:this={editorEl} bind:value={q} />
      <button class="btn btn-primary" on:click={onSQLSubmit} style="width:100%;">Visualize Query</button>
    </div>
    <div class="col-md-3">
      <h3>CSV 
        <small><input bind:value={newTableName} placeholder="New Table Name"/></small> </h3>
      <textarea class="editor" id="csv" bind:this={csvEl} bind:value={csv} />
      <button class="btn btn-primary" on:click={addTable} style="width:100%;">Add Table</button>
    </div>
    <div class="col-md-3">
      <h3>Tables</h3>
      <ul class="schema">
        {#each schemas as [name, schema] }
          <li><b>{name}</b>({schema})</li>
        {/each}
      </ul>
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
        <div class="bd-callout bd-callout-danger" role="alert">
          <h3>
            Could Not Parse Query <small>
              <!--<a target="_blank" href={`https://docs.google.com/forms/d/e/1FAIpQLSeqdk3ZqQms92iaGq5rKV6yUdnhLcRllc8igQPl1KGUwfCEUw/viewform?usp=pp_url&entry.351077705=${encodeURI(q)}&entry.1154671727=${encodeURI(csv)}&entry.1900716371=${encodeURI(errmsg)}`} class="link">report bug</a>-->
              <a href="#" data-bs-toggle="modal" data-bs-target="#modalBug">report bug</a>
            </small>
          </h3>
          <pre>{errmsg}</pre>
        </div>
      </div>
    </div>
    {/if}


  <div class="row footer" style="margin-top: 3em;">
    <div class="col-md-6 offset-md-3 text-center" style="border-top: 1px solid grey;">
      <p>
      <span class="text-muted">SQLTutor created by <a href="https://eugenewu.net">Eugene Wu</a> and Robert Ward</span>
      </p>

      <p style="font-size:smaller;">
      See <a href="https://github.com/cudbg/sqltutor">github repo</a> for code.   
      Implemented using the instructional 
        <a href="https://github.com/w6113/databass-public">Databass DBMS</a>
        developed for Columbia's <a href="https://w6113.github.io">COMS6113</a>,
        <a href="https://pyodide.org/">pyodide</a>,
        <a href="https://convex.dev/">convex</a>,
        and table vis from <a href="https://pandastutor.com/">pandastutor</a>.
      </p>

    </div>
  </div>




</main>


