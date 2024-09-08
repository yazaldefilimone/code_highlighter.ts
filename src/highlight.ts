type LineInfo = {
  number: number;
  startIndex: number;
  endIndex: number;
};

function highlightError(iniIdx: number, endIdx: number, file: string): string {
  return highlight(iniIdx, endIdx, file, '\x1b[4m\x1b[31m');
}

function highlightWarning(iniIdx: number, endIdx: number, file: string): string {
  return highlight(iniIdx, endIdx, file, '\x1b[4m\x1b[33m');
}

function highlightErrorWithContext(iniIdx: number, endIdx: number, file: string, linesCtx: number): string {
  return highlightContext(iniIdx, endIdx, file, '\x1b[4m\x1b[31m', linesCtx);
}

function highlightWarningWithContext(iniIdx: number, endIdx: number, file: string, linesCtx: number): string {
  return highlightContext(iniIdx, endIdx, file, '\x1b[4m\x1b[33m', linesCtx);
}

function highlight(iniIdx: number, endIdx: number, file: string, color: string): string {
  return highlightContext(iniIdx, endIdx, file, color, 0);
}

function highlightContext(iniIdx: number, endIdx: number, file: string, color: string, linesCtx: number): string {
  if (iniIdx > endIdx) {
    throw new Error('initial index must be less than or equal to end index');
  }

  const text = endIdx <= file.length ? file : file + ' '.repeat(endIdx - file.length);

  const lineInfo = getLineInfo(text, iniIdx, endIdx);
  const context = getContext(text, lineInfo, linesCtx, linesCtx);
  return buildHighlightedText(text, context, iniIdx, endIdx, color);
}

function getLineInfo(text: string, iniIdx: number, endIdx: number): LineInfo[] {
  const lineInfo: LineInfo[] = [];
  let currentLine: LineInfo = { number: 1, startIndex: 0, endIndex: 0 };

  for (let idx = 0; idx < text.length; idx++) {
    const chr = text[idx];

    if (idx >= iniIdx && lineInfo.length === 0) {
      lineInfo.push({ ...currentLine });
    }

    if (chr === '\n') {
      currentLine.endIndex = idx;
      if (idx >= iniIdx && idx < endIdx && !lineInfo.some((li) => li.number === currentLine.number)) {
        lineInfo.push({ ...currentLine });
      }
      currentLine.number++;
      currentLine.startIndex = idx + 1;
    }

    if (idx >= endIdx) {
      if (!lineInfo.some((li) => li.number === currentLine.number)) {
        currentLine.endIndex = idx;
        lineInfo.push({ ...currentLine });
      }
      break;
    }
  }

  if (lineInfo.length === 0) {
    currentLine.endIndex = text.length;
    lineInfo.push(currentLine);
  }

  return lineInfo;
}

function getContext(text: string, lineInfo: LineInfo[], linesCtx: number, linesAfter: number): LineInfo[] {
  const startLine = lineInfo[0].number;
  const endLine = lineInfo[lineInfo.length - 1].number;

  const contextStart = Math.max(1, startLine - linesCtx);
  const contextEnd = Math.min(endLine + linesAfter, text.split('\n').length);

  return Array.from({ length: contextEnd - contextStart + 1 }, (_, i) => {
    const lineNum = contextStart + i;
    const startIndex =
      text
        .split('\n')
        .slice(0, lineNum - 1)
        .join('\n').length + (lineNum > 1 ? 1 : 0);
    const endIndex = startIndex + text.split('\n')[lineNum - 1].length;
    return { number: lineNum, startIndex, endIndex };
  });
}

function buildHighlightedText(
  text: string,
  context: LineInfo[],
  iniIdx: number,
  endIdx: number,
  color: string,
): string {
  const reset = '\x1b[0m';
  const numLen = context[context.length - 1].number.toString().length;

  let result = '';
  let highlighting = false;

  for (const line of context) {
    const lineContent = text.slice(line.startIndex, line.endIndex);
    const lineNumber = line.number.toString().padStart(numLen);

    result += `${lineNumber} | `;

    let currentIndex = line.startIndex;
    for (const chr of lineContent) {
      if (currentIndex >= iniIdx && currentIndex < endIdx && !highlighting) {
        result += color;
        highlighting = true;
      } else if (currentIndex >= endIdx && highlighting) {
        result += reset;
        highlighting = false;
      }
      result += chr;
      currentIndex += 1;
    }

    if (highlighting) {
      result += reset;
      highlighting = false;
    }

    result += '\n';
  }

  return result;
}

export {
  highlightError,
  highlightWarning,
  highlightErrorWithContext,
  highlightWarningWithContext,
  highlight,
  highlightContext,
};
