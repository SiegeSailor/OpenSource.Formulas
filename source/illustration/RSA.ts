import chalk from "chalk";

import {
  babyStepGiantStep,
  blumBlumShub,
  fastModularExponentiation,
  millerRabinPrimarilyTest,
  multiplicativeInverse,
  pollardP1Factorization,
} from "../entry-point";
import { EActors } from "../common/constants";
import { log, inquire } from "../common/utilities";

function obtainPQ(bits: number, level: number) {
  const arrayOfPrime: bigint[] = [];

  while (arrayOfPrime.length != 2) {
    const numberPseudoRandom = blumBlumShub(bits)();
    if (millerRabinPrimarilyTest(numberPseudoRandom, level))
      arrayOfPrime.push(numberPseudoRandom);
  }
  return arrayOfPrime;
}

function obtainCandidates(base: bigint, modulo: bigint) {
  return multiplicativeInverse(base, modulo, 10);
}

function encrypt(message: string, exponent: bigint, modulo: bigint) {
  return message.split("").map((character) => {
    const code = character.charCodeAt(0);
    return fastModularExponentiation(BigInt(code), exponent, modulo);
  });
}

function decrypt(
  arrayOfEncryptedCode: bigint[],
  exponent: bigint,
  modulo: bigint
) {
  return arrayOfEncryptedCode
    .map((codeEncrypted) => {
      const code = fastModularExponentiation(codeEncrypted, exponent, modulo);
      return String.fromCharCode(Number(code));
    })
    .join("");
}

function findPrivateKey(generator: bigint, base: bigint, modulo: bigint) {
  return babyStepGiantStep(generator, base, modulo);
}

async function _() {
  try {
    log.highlight("=== Demonstrating RSA Encryption ===");
    console.log("There are three people in this RSA encryption process:");
    console.log(
      `\t${EActors.Alice} - Receiver\n\t${EActors.Bob} - Sender\n\t${EActors.Eve} - Eavesdropper`
    );

    const [p, q, n, r] = await inquire.confirm(
      `${EActors.Alice} is going to pick up prime numbers P and Q:`,
      () => {
        const bits = 8,
          level = 5;
        const [p, q] = obtainPQ(bits, level);

        const n = p * q;
        const r = (p - BigInt(1)) * (q - BigInt(1));
        log.list([
          { name: "P", value: p },
          { name: "Q", value: q },
          { name: "n", value: n },
          { name: "r", value: r },
        ]);

        return [p, q, n, r];
      }
    );

    const candidate = await inquire.confirm(
      `${EActors.Alice} is going to pick the candidates which equal % r = 1:`,
      () => {
        const arrayOfCandidate = obtainCandidates(r + BigInt(1), r);
        log.list(
          arrayOfCandidate.map((candidate, index) => {
            return { name: String(index + 1), value: candidate };
          })
        );

        return arrayOfCandidate[0];
      }
    );

    const [e, d] = await inquire.confirm(
      `${EActors.Alice} selects the first value from the list to compute e and d:`,
      () => {
        const arrayOfPrimeFactor = pollardP1Factorization(candidate);
        console.log(`\t${candidate} has factors: ${arrayOfPrimeFactor}`);

        return arrayOfPrimeFactor;
      }
    );

    const message = "This is a hardcoded secret message.";
    await inquire.confirm(
      `${EActors.Alice} chooses ${chalk.bgGray(
        message
      )} as the secret message:`,
      () => {
        console.log(`\tNow ${EActors.Alice} has the following numbers:`);
        log.list([
          { name: "P", value: p },
          { name: "Q", value: q },
          { name: "n", value: n },
          { name: "r", value: r },
          { name: "e", value: e },
          { name: "d", value: d },
        ]);
        console.log(
          `\n\t${EActors.Alice} sends ${chalk.bold.bgCyan(
            "(e, n)"
          )} as the public key to ${EActors.Bob} and ${EActors.Eve}.`
        );
      }
    );

    const arrayOfEncryptedCode = await inquire.confirm(
      `${EActors.Bob} encrypts the message and sends it back to ${EActors.Alice} (while ${EActors.Eve} is eavesdropping).`,
      () => {
        const arrayOfEncryptedCode = encrypt(message, BigInt(e), n);
        console.log(`\tEncrypted message: ${chalk.gray(arrayOfEncryptedCode)}`);

        const messageDecrypted = decrypt(arrayOfEncryptedCode, BigInt(d), n);
        console.log(
          `\n\t${
            EActors.Alice
          } can decrypt the message since she has the private key ${chalk.bold.bgCyan(
            "(d, n)"
          )}.\n\tDecrypted message: ${chalk.gray(messageDecrypted)}\n\t${
            EActors.Alice
          } verifies the message with ${EActors.Bob} privately.`
        );

        return arrayOfEncryptedCode;
      }
    );

    await inquire.confirm(
      `${EActors.Eve} is going to decrypt the secret message.`,
      () => {
        console.log(`\tNow ${EActors.Eve} has the following stuff:`);
        log.list([
          { name: "n", value: n },
          { name: "e", value: e },
          { name: "secret message", value: arrayOfEncryptedCode },
        ]);

        console.log(
          `\n\t${
            EActors.Eve
          } is going to figure out what the private key d is using Discrete Log with the public key ${chalk.bold.bgCyan(
            "(e, n)"
          )} and other information.`
        );
        const d = findPrivateKey(BigInt(e), n, 1n);
        console.log(
          `\tPrivate Key ${chalk.bold.bgCyan("(d, n)")}: ${chalk.gray(
            `(${d}, ${n})`
          )}`
        );
        const messageDecrypted = decrypt(arrayOfEncryptedCode, d, n);
        console.log(
          `\tDecrypted message: ${chalk.gray(messageDecrypted)}\n\t${
            EActors.Eve
          } verifies the message with ${EActors.Bob}.`
        );
      }
    );

    log.highlight("=== End of RSA Encryption ===");
  } catch (error) {
    throw error;
  }
}

export default _;
