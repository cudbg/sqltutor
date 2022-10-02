
export const queries = [
  {
    name: "select all",
    q: "select * from sailors"
  },
  {
    name: "groupby having",
    q: `SELECT s.sid, sum(s.age)
FROM sailors as s,
     reserves as r
WHERE s.sid = r.sid
GROUP BY s.sid
HAVING count(1) > 1`
  },
  {
    name: "subquery",
    q: `SELECT x, d
FROM (SELECT a*b as x, c, d 
      FROM data) AS d2 
WHERE c = 0`
  },
  {
    name: "subquery groupby",
    q: `SELECT c, sum(x)
FROM (SELECT a*b as x, c, d 
      FROM data) AS d2 
GROUP BY c`
  },
  {
    name: "subquery join",
    q: `SELECT a, sum(b+2) * 2 as c 
FROM data, 
     (SELECT a*b as x, c, d 
      FROM data) AS d2 
WHERE data.b = d2.x
GROUP BY a`
  }
]
