import { randomUUID } from "crypto";

export function randomText(length: number = 10) {
  return randomUUID().replace(/-/g, "").slice(0, length);
}

export function randomThaiText(length: number = 10): string {
  const thaiChars = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ";
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * thaiChars.length);
    result += thaiChars[index];
  }
  return result;
}

export function randomNumberText(length: number = 10): string {
  const numbers = "0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return result;
}
