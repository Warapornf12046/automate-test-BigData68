import { randomInt } from "crypto";

export function randomNumber(length: number = 10) {
  if (length <= 0) return "";

  const firstDigit = String(randomInt(1, 10));
  const otherDigits = Array.from({ length: length - 1 }, () =>
    String(randomInt(0, 10)),
  ).join("");

  return firstDigit + otherDigits;
}