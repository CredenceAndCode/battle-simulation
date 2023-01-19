import { Obj } from "./generalTypes";
export const isAllTrue = (obj: Obj) => {
  return Object.keys(obj).every((key) => obj[key] === true);
};
