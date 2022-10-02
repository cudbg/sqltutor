import { mutation } from "./_generated/server";

export default mutation(async ({db}, sessionID: string, q: string, csv: string, errmsg: string, isBug: boolean, comment: string, email: string) => {
  errmsg = errmsg ?? null;
  isBug = isBug ?? false;
  comment = comment ?? null;
  email = email ?? null;
  db.insert("stats", {
    sessionID,
    q,
    csv,
    errmsg,
    isBug,
    comment,
    email
  });
})