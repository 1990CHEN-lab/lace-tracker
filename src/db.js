import Dexie from "dexie";

export const db = new Dexie("laceTrackerDB");

db.version(1).stores({
  items: "++id,name,category,createdAt"
});
