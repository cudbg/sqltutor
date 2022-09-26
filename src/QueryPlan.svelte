<script lang="ts">
  import { onMount, afterUpdate } from "svelte"
  import { tree, hierarchy } from "d3-hierarchy"
  import { select, selectAll } from "d3-selection"
  import { selectedOpids, lineageData } from "./stores.ts"
  import * as R from "ramda"

  export let h;
  export let margin = { t: 50, r: 0, b: 50, l: 0};
  let queryPlan = null;
  let info = null; 
  let root;
  let nodes;
  let mounted = false;
  let treemap = null; 
  let clientWidth = 0;
  let circles;
  let opid2circles; // int -> circle dom element
  let opidOrder = [];  // postfix traversal order of query plan

  let svgEl, gEl, divEl;


  $: {
    if (clientWidth) {
      queryPlan = $lineageData.op;
      info = $lineageData.op_info;
      root = { id: queryPlan.root, queryPlan }
      //  assigns the data to a hierarchy using parent-child relationships
      nodes = hierarchy(root, (d) => {
        let ret = queryPlan[d.id]?.map((id) => { return { id, queryPlan } })
        return ret;
      })
      opidOrder = computePostfixOrder(queryPlan.root[0], queryPlan)

      if (mounted) {
        render();
        step(0)
      }
    }
  }
  $: {
    if (opid2circles) {
      circles.attr("fill", "black")
      let opids = $selectedOpids ?? []

      opids.forEach((opid) => {
        if (!opid2circles[opid]) return;
        select(opid2circles[opid]).attr("fill", "red")
      })
    }
  }

  function computePostfixOrder(opid, queryPlan) {
    if (R.isEmpty(queryPlan[opid])) return [opid]
    let order = []
    queryPlan[opid].forEach((childid) => {
      order = order.concat(computePostfixOrder(childid, queryPlan))
    })
    order.push(opid)
    return order;
  }

  let stepIdx = 0;
  function step(inc) {
    stepIdx += inc;
    stepIdx = Math.max(Math.min(stepIdx, opidOrder.length-1), 0);
    $selectedOpids = [opidOrder[stepIdx]]
  }

  function onKey(e) {
    if (e.key == "ArrowLeft") {
      step(-1)
    } else if (e.key == "ArrowRight") {
      step(1)
    }
  }

  onMount(() => {
    mounted = true;
  })

  function render() {
    var svg = select(svgEl)
    var g = select(gEl)
    g.selectAll("*").remove()

    console.log(svgEl.parentNode)
    console.log(clientWidth)
    treemap = tree().size([clientWidth-margin.l-margin.r, h-margin.t-margin.b]);
    nodes = treemap(nodes);

    svg
      .attr("height", h)
      .attr("width", clientWidth)

    // adds the links between the nodes
    var link = g.selectAll(".link")
        .data(nodes.descendants().slice(1))
      .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "grey")
        .attr("marker-end","url(#arrowHead)")
        .attr("d", (d) => {
          return `M${d.x},${d.y}C${(d.x + d.parent.x)/2},${d.y}` +
          ` ${(d.x + d.parent.x)/2},${d.parent.y}`+
          ` ${d.parent.x},${d.parent.y}`
        })

    // adds each node as a group
    let node = g.selectAll(".node")
        .data(nodes.descendants())
      .enter().append("g")
        .attr("class", (d) =>  
          `node opNode ${(d.children ? "node--internal" : " node--leaf")}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)

    // adds the circle to the node
    circles = node.append("text")
        //.attr("r", 10)
        .text((d) => info[d.data.id].name)
        .style("text-anchor", "middle")
        .attr("role", "button")
        .on("click", async function() {
          let opid = this.__data__.data.id
          $selectedOpids = [opid];
        })

    opid2circles = {}
    circles.each(function() {
      opid2circles[this.__data__.data.id] = this; 
    })

    // adds the text to the node
    if (0) {
      node.append("text")
        .attr("dy", "0.5em")
        .attr("font-size", "0.8em")
        .attr("x", "-2em")
        .style("text-anchor", "end")
        .text((d) =>  info[d.data.id].name );
    }
  }

  async function onCircleClick() {
  }
</script>


<style>
  svg circle.opSelected {
    fill: red;
  }
  svg circle.hover {
    fill: gray;
  }

</style>

<svelte:window on:keydown={onKey}/>


<div bind:clientWidth={clientWidth}>
<h2>Query Plan</h2>
<pre><code class="queryText">{$lineageData.qstr}</code></pre>
<!--<button id="visualizeButton" type="button" on:click={onClick}>Visualize Entire Query Plan</button>-->
<div>
  <button on:click={() => step(-1)}>prev op</button>
  <button on:click={() => step(1)}>next op</button>
</div>
<svg id="qPlanTreeSVG"  bind:this={svgEl}>
  <g 
     id="qPlanTree" 
     transform={`translate(${margin.l}, ${margin.t})`}
     bind:this={gEl} />
</svg>
</div>

