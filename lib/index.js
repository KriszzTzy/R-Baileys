"use strict";

const chalk = require("chalk");

const clearConsole = () => {
  process.stdout.write(
    process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H"
  );
};

clearConsole();

const line = chalk.hex('#7c3aed')('━'.repeat(44));
const dim  = chalk.hex('#4c1d95')('─'.repeat(44));

console.log('\n' + line);

console.log(dim);

console.log(
  chalk.hex('#FFEB3B').bold(`'⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿
⣿⠃⠀⠀⠀⠀⢀⠀⠀⠀⠀⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿
⡏⠀⠀⠀⠀⠀⠸⡀⠀⠀⠀⣟⣣⡀⠀⠀⠀⠀⠀⠀⠀⡎⣿⣿⣿
⡇⠀⠀⠀⠀⠀⠿⣷⠀⠀⠀⢟⠯⠉⠀⠀⠀⠀⠀⠀⠀⡇⣿⣿⣿
⡇⠀⠀⠀⠀⢠⠀⠁⢀⠀⠀⣯⣞⣄⣐⣳⠀⠀⠀⠀⠀⢇⣿⣿⣿
⣇⠇⠀⠀⠀⡴⢶⣾⣿⣆⠀⢹⣿⣿⣿⣿⠀⠀⠀⠀⣨⣾⣿⣿⣿
⣿⡄⡀⠀⠀⣿⣿⣿⣿⣮⣷⣄⢽⣿⣿⡟⠀⠀⠀⣰⣿⣿⣿⣿⣿
⣿⡇⣦⠀⡆⣮⣻⡿⣟⣽⣞⣿⣷⣿⣿⠝⠀⠀⠀⠘⣿⣿⣿⣿⣿
⣿⣷⡽⣰⡧⢛⣯⡾⠆⠿⣿⣿⡿⢟⣵⠀⠀⠀⠠⣼⣿⣿⣿⣿⣿
⣿⣿⣾⣟⣿⣿⣯⣤⠷⠙⠓⠒⠈⠁⠀⠀⠀⠰⣿⣿⣿⣿⣿⣿⣿
⣿⣿⢻⣿⣷⣿⣿⣤⡶⠆⣰⣶⣶⣶⣿⡄⠠⣑⣲⣿⣿⣿⣿⣿⣿
⣿⢣⣿⣿⣿⣿⣿⣵⡶⠶⢎⣿⣿⣿⣿⣷⠄⣔⣿⣭⣭⣭⢉⡟⣻
⢳⣿⣿⣿⣿⣿⣿⣏⣾⣾⣿⣿⣿⣿⣿⣿⠇⣿⣿⣿⣿⢫⢎⡾⣿`)
  chalk.hex('#d7a1ff').italic(' ✦ THANKS FOR USING\n') +
  chalk.hex('#a78bfa').bold('       R-BAILEYS  ♡\n')
);

console.log(dim);

console.log(
  chalk.hex('#89CFF0')('  ◈  Modified by  ') + chalk.hex('#c084fc').bold('Kristian') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Contact      ') + chalk.hex('#a78bfa').bold('t.me/z4phdev') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Node.js      ') + chalk.hex('#e2d9f3').bold(process.version)
);

console.log('\n' + line);

console.log(
  chalk.hex('#7c3aed').italic('\n    ⋆ ˚ ✦ ₊ ˚ ෆ  Ready to connect...  ෆ ˚ ₊ ✦ ˚ ⋆\n')
);

console.log(line + '\n');

var createBinding =
  (this && this.createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          (!("get" in desc) && (desc.writable || desc.configurable))
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });

var exportStar =
  (this && this.exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        createBinding(exports, m, p);
  };

var importDefault =
  (this && this.importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };

Object.defineProperty(exports, "__esModule", { value: true });

const Socket_1 = importDefault(require("./Socket"));

exports.makeWASocket = Socket_1.default;

exportStar(require("../WAProto"), exports);
exportStar(require("./Utils"), exports);
exportStar(require("./Types"), exports);
exportStar(require("./Store"), exports);
exportStar(require("./Defaults"), exports);
exportStar(require("./WABinary"), exports);
exportStar(require("./WAM"), exports);
exportStar(require("./WAUSync"), exports);
exportStar(require("./Function"), exports);

exports.default = Socket_1.default;