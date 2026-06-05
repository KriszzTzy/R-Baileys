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

console.log(
  chalk.hex('#c084fc').bold('\n  ██╗  ██╗██╗  ██╗██╗   ██╗███████╗') + '\n' +
  chalk.hex('#a78bfa').bold('  ██║ ██╔╝██║  ██║╚██╗ ██╔╝╚══███╔╝') + '\n' +
  chalk.hex('#8b5cf6').bold('  █████╔╝ ███████║ ╚████╔╝   ███╔╝ ') + '\n' +
  chalk.hex('#7c3aed').bold('  ██╔═██╗ ██╔══██║  ╚██╔╝   ███╔╝  ') + '\n' +
  chalk.hex('#6d28d9').bold('  ██║  ██╗██║  ██║   ██║   ███████╗') + '\n' +
  chalk.hex('#5b21b6').bold('  ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝') + '\n'
);

console.log(dim);

console.log(
  chalk.hex('#d7a1ff').italic('  ✦  T H A N K S   F O R   U S I N G\n') +
  chalk.hex('#a78bfa').bold('       K H Y Z - B A I L E Y S  ♡\n')
);

console.log(dim);

console.log(
  chalk.hex('#89CFF0')('  ◈  Version      ') + chalk.hex('#e2d9f3').bold('2.0.0') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Platform     ') + chalk.hex('#e2d9f3').bold('WhatsApp Web (Multi-Device)') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Modified by  ') + chalk.hex('#c084fc').bold('KhyzTzyy') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Contact      ') + chalk.hex('#a78bfa').bold('wa.me/KhyzTzyy') + '\n' +
  chalk.hex('#89CFF0')('  ◈  Node.js      ') + chalk.hex('#e2d9f3').bold(process.version)
);

console.log('\n' + line);

console.log(
  chalk.hex('#7c3aed').italic('\n    ⋆ ˚ ✦ ₊ ˚ ෆ  Ready to connect  ෆ ˚ ₊ ✦ ˚ ⋆\n')
);

console.log(line + '\n');

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWASocket = void 0;
const Socket_1 = __importDefault(require("./Socket"));
exports.makeWASocket = Socket_1.default;
__exportStar(require("../WAProto"), exports);
__exportStar(require("./Utils"), exports);
__exportStar(require("./Types"), exports);
__exportStar(require("./Store"), exports);
__exportStar(require("./Defaults"), exports);
__exportStar(require("./WABinary"), exports);
__exportStar(require("./WAM"), exports);
__exportStar(require("./WAUSync"), exports);

exports.default = Socket_1.default;
