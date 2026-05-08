import { randomUUID } from "crypto";

export function randomText(length: number = 10) {
  return randomUUID().replaceAll("-", "").substring(0, length);
}