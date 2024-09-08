import { highlightErrorWithContext } from './highlight';

const code_block = `functon is_zero (x) {
    if (x == 0) [
      return true;
    ] else {
      return false;
    }
}`;

const highlight = highlightErrorWithContext(38, 64, code_block, 2);
console.log(highlight);
// 38, 64, &code, 2)
