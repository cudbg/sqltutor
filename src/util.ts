import * as R from "ramda"


export function makeWstTable({ columns, rows }) {
  return {
    col_labels: columns,
    row_labels: R.times(R.identity, rows.length),
    data: rows
  }
}

export function opStepVis(opName, lhs, lhs2, rhs, annotations) {
  let tables = null
  if (lhs2) 
    tables = { lhs, lhs2, rhs }
  else 
    tables = { lhs, rhs }

  return {
    css_id: opName,
    tables,
    expr: {
      code: "",
      range: {
        start: {line: 0, ch: 0},
        end: {line: 1, ch: 0}
      }
    },
    annotations
  }
}


export function projection(opid, lineageData, addOns) {
  let info = lineageData.op[opid]
  let lhsObj = lineageData.results[lineageData.op[opid][0]]
  let rhsObj = lineageData.results[opid]
  let colLineage = lineageData.col[opid]


  addOns.desc = "Projection - keeping the fields: " + info.str
  addOns.opType = "projectionOp"
  addOns.tableCaptions.lhs = lineageData.info[lineageData.op[opid][0]].name
  addOns.tableCaptions.rhs = info.name

  let annotations = []

  // the columns to make arrows to
  colLineage.forEach((inputColIdxs, oCol) => {
    inputColIdxs.forEach((iCol) => {
      annotations.push({
        type: "arrow",
        from: { table: "lhs", row: "header", col: iCol },
        to: { table: "rhs", row: "header", col: oCol }
      })
    })
  })

  // Cross out rejected columns
  R.times((i) => {
    if (colLineage.flat().includes(i)) return;
    annotations.push({
      type: "crossout", 
      target: {
        table: "lhs", 
        row: "all", 
        col: i
      }
    })
  }, lhsObj.columns.length)

  // color the rows
  R.times((row) => {
    annotations.push({
      type:"color_set", 
      set: [
        {table: "lhs", row, col: "all"},
        {table: "rhs", row, col: "all"}
      ]})
  },  rhsObj.rows.length)

  return opStepVis(info.name, makeWstTable(lhsObj), null, makeWstTable(rhsObj), annotations )
}


export function hashjoin(opid, lineageData, addOns) {
  let lhsObj = lineageData.results[lineageData.op[opid][0]]
  let lhs2Obj = lineageData.results[lineageData.op[opid][1]]
  let rhsObj = lineageData.results[opid]
  let lineageObj = lineageData.row[opid]
  let colLineage = lineageData.col[opid]
  let info = lineageData.info[opid]

  addOns.desc = "matches up tuples of both tables based on condition: " + info.str
  addOns.opType = "hashJoinOp"
  addOns.tableCaptions.lhs = lineageData.info[lineageData.op[opid][0]].name
  addOns.tableCaptions.lhs2 = lineageData.info[lineageData.op[opid][1]].name
  addOns.tableCaptions.rhs = info.name

  let annotations = []

  // need to know attributes in join condition
  if (false) {
    let colsToHighlight = [
      ["lhs", colid]
      ["lhs2", colid]
      ["rhs", colid]
      ["rhs", colid]
    ]
    colsToHighlight.map(([table, col]) => { 
      return { type: "box", target: { table, col, row: "all" } }
    })
  }

  // lineage is [ (srcid, [(oid, iid),...]), .. ]
  // needto find for each iid in source 0, all iids in source 1 that share
  // the same output oid
  console.log(lineageObj)
  let leftPairs = lineageObj[0][1]
  let rightPairs = lineageObj[1][1]
  R.zip(leftPairs, rightPairs).forEach(([[loid, liid], [roid, riid]]) => {
    let lhsRow = {table: "lhs", col: "all", row: liid },
      lhs2Row = {table: "lhs2", col: "all", row: riid },
      rhsRow = {table: "rhs", col: "all", row: loid }

    annotations.push({
      type:"color_set", 
      set: [ lhsRow, lhs2Row, rhsRow ]
    })
    annotations.push({
      type: "arrow", 
      from: lhsRow, 
      to: lhs2Row
    })
  })

  let lhs = makeWstTable(lhsObj),
    lhs2 = makeWstTable(lhs2Obj),
    rhs = makeWstTable(rhsObj)

  return opStepVis(info.name, lhs, lhs2, rhs, annotations )
}


export function groupby(opid, lineageData, addOns) {
  let lhs = makeWstTable(lineageData.results[lineageData.op[opid][0]])
  let rhs = makeWstTable(lineageData.results[opid])
  let lineageObj = lineageData.row[opid]
  let info = lineageData.info[opid]

  addOns.desc = "Groups rows and merges their data: " + info.str
  addOns.opType = "hashGroupOp"
  addOns.tableCaptions.lhs = lineageData.info[lineageData.op[opid][0]].name
  addOns.tableCaptions.rhs = info.name

  let annotations = []
  let colors = R.times((i) => {
    return { 
      type: "color_set", 
      set: [ { table: "rhs", row: i, col: "all" } ] 
    }
  }, rhs.data.length)

  lineageObj.forEach(([srcid, pairs]) => {
    pairs.forEach(([oid, iid]) => {
      let lrow = { table: "lhs", col: "all", row: iid },
        rrow = { table: "rhs", col: "all", row: oid }
      annotations.push({ type: "arrow", from: lrow, to: rrow })
      colors[oid].set.push(lrow)
    })
  })
  annotations = annotations.concat(colors)

  return opStepVis(info.name, lhs, null, rhs, annotations )
}

export function filter(opid, lineageData, addOns) {
  let lhs = makeWstTable(lineageData.results[lineageData.op[opid][0]])
  let rhs = makeWstTable(lineageData.results[opid])
  let lineageObj = lineageData.row[opid]
  let info = lineageData.info[opid]
  let colLineage = lineageData.col[opid]
  
  addOns.desc = "Filter - only keeping tuples meeting the condition: " + info.str
  addOns.opType = "filterOp"
  addOns.tableCaptions.lhs = lineageData.info[lineageData.op[opid][0]].name
  addOns.tableCaptions.rhs = info.name

  let annotations = []
  let boxSet = []

  // the columns to outline
  // indexes of attributes in predicate
  if (false) {
    let colIdxs = []
    colIdxs.forEach((col) => 
      boxSet.push({
        type: "box", 
        target: { table: "lhs", row: "all", col }
      })
    )
  }

  lineageObj[0][1].forEach(([oid, iid]) => {
    let lRow = {table: "lhs", row: iid, col: "all"}
    let rRow = {table: "rhs", row: oid, col: "all"}
    annotations.push({type:"color_set", set: [lRow, rRow]})
    annotations.push({type: "arrow", from: lRow, to: rRow})
  })
  
  let iids = lineageObj[0][1].map(([oid, iid]) => iid)

  R.times((row) => {
    if (!iids.includes(row))
      annotations.push({
        type: "crossout",
        target: { table: "lhs", row, col: "all" }
      })
  }, lhs.data.length)

  annotations = boxSet.concat(annotations)
  return opStepVis(info.name, lhs, null, rhs, annotations )
}

export function scan(opid, lineageData, addOns) {
  let lhs = makeWstTable(lineageData.results[opid])
  let rhs = lhs;
  let info = lineageData.info[opid]
  let lineageObj = lineageData.row[opid]
  addOns.desc = "Scans all the tuples of the input table " + info.str
  addOns.opType = "scanOp"
  addOns.tableCaptions.lhs = info.name
  addOns.tableCaptions.rhs = info.name

  let annotations = []
  R.times((row) => {
    let lrow = {table: "lhs", row, col: "all"}
    let rrow = {table: "rhs", row, col: "all"}
    annotations.push({type:"color_set", set: [lrow, rrow]})
    annotations.push({type: "arrow", from: lrow, to: rrow})
  }, rhs.data.length)

  return opStepVis(info.name, lhs, null, rhs, annotations )
}


export function query(opid, lineageData, addOns) {
  let lhs = makeWstTable(lineageData.results[opid])
  let rhs = lhs;
  let info = lineageData.info[opid]
  addOns.opType = "queryOp"
  addOns.tableCaptions.lhs = info.name
  return opStepVis(info.name, lhs, null, null, [])
}

class Lineage{
  lineageData;

  constructor(lineageData) {
    this.lineageData = lineageData;
  }


}
