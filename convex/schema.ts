import { defineSchema, defineTable, s } from "convex/schema";

export default defineSchema({
  stats: defineTable({
    sessionID: s.string(),
    q: s.string(),
    csv: s.string(),
    errmsg: s.string(),
    isBug: s.boolean(),
    comment: s.string(),
    email: s.string()
  })
});
