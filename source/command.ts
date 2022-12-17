import inquirer from "inquirer";
import PressToContinuePrompt from "inquirer-press-to-continue";
import chalk from "chalk";
import { readdirSync } from "fs";
import { join } from "path";

import { ENames, EChoices } from "./common/constants";

inquirer.registerPrompt("press-to-continue", PressToContinuePrompt);

function exit() {
  console.log(chalk.gray("Successfully terminated the program."));
}

function execute() {
  throw new Error("This feature is not ready yet.");
}

async function demonstrate() {
  try {
    const { [ENames.Demonstrate]: demonstrate } = await inquirer.prompt([
      {
        type: "list",
        name: ENames.Demonstrate,
        message: "Which cryptograph procedure do you want to demonstrate?",
        choices: readdirSync(join(process.cwd(), "source/illustration")).map(
          (filename) => {
            return { name: filename };
          }
        ),
      },
    ]);
    const call = await import(
      join(process.cwd(), `source/illustration/${demonstrate}`)
    );
    await call.default();
  } catch (error) {
    throw error;
  }
}

async function main(message = "What do you want to do?") {
  return inquirer
    .prompt([
      {
        type: "list",
        name: ENames.Purpose,
        message,
        choices: [
          { name: EChoices.Demonstrate },
          { name: EChoices.Execute },
          { name: EChoices.Exit },
        ],
      },
    ])
    .then(async ({ [ENames.Purpose]: purpose }) => {
      switch (purpose) {
        case EChoices.Demonstrate:
          await demonstrate();
          main();
          break;
        case EChoices.Execute:
          execute();
          main();
          break;
        case EChoices.Exit:
          exit();
          break;
        default:
          throw new Error("Something wrong with the prompt flow.");
      }
    })
    .catch((_) => {
      const error: Error = _;
      console.error(`\t${chalk.red(error.message)}`);
      main("Unexpected result. Please restart your flow.");
    });
}

main();
