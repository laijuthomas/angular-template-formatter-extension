#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const startMarkerRegex = /\/\*START_MIGRATED\*\//g;
const endMarkerRegex = /\/\*END_MIGRATED\*\//g;
const startI18nMarkerRegex = /\/\*START_I18N_BLOCK\*\//g;
const endI18nMarkerRegex = /\/\*END_I18N_BLOCK\*\//g;
const replaceMarkerRegex = /\/\*REPLACE_LINE\*\//g;
const selfClosingList = 'input|br|img|hr|meta|link|base|area|col|embed|keygen|param|source|track|wbr';

function generateI18nMarkers(template) {
  return template;
}

function formatTemplate(tmpl, templateType = 'html') {
  if (tmpl.indexOf('\n') > -1) {
    tmpl = generateI18nMarkers(tmpl);

    let openSelfClosingEl = false;
    const openBlockRegex = /^\s*\@(if|switch|case|default|for)|^\s*\}\s\@else/;
    const openElRegex = /^\s*<([a-z0-9]+)(?![^>]*\/>)[^>]*>?/;
    const openAttrDoubleRegex = /="([^"]|\\")*$/;
    const openAttrSingleRegex = /='([^']|\\')*$/;
    const closeAttrDoubleRegex = /^\s*([^><]|\\")*"/;
    const closeAttrSingleRegex = /^\s*([^><]|\\')*'/;
    const selfClosingRegex = new RegExp(`^\\s*<(${selfClosingList}).+\\/?>`);
    const openSelfClosingRegex = new RegExp(`^\\s*<(${selfClosingList})(?![^>]*\\/>)[^>]*$`);
    const closeBlockRegex = /^\s*\}\s*$|^\s*\}\s\@else/;
    const closeElRegex = /\s*<\/([a-zA-Z0-9\-_]+)\s*>/m;
    const closeMultiLineElRegex = /^\s*([a-zA-Z0-9\-_\[\]]+)?=?"?([^”<]+)?"?\s?\/>$/;
    const closeSelfClosingMultiLineRegex = /^\s*([a-zA-Z0-9\-_\[\]]+)?=?"?([^”\/<]+)?"?\s?>$/;
    const singleLineElRegex = /\s*<([a-zA-Z0-9]+)(?![^>]*\/>)[^>]*>.*<\/([a-zA-Z0-9\-_]+)\s*>/;

    const lines = tmpl.split('\n');
    const formatted = [];
    let indent = '';
    let mindent = '';
    let depth = 0;
    let i18nDepth = 0;
    let inMigratedBlock = false;
    let inI18nBlock = false;
    let inAttribute = false;
    let isDoubleQuotes = false;

    for (let [index, line] of lines.entries()) {
      depth +=
        [...line.matchAll(startMarkerRegex)].length - [...line.matchAll(endMarkerRegex)].length;
      inMigratedBlock = depth > 0;
      i18nDepth +=
        [...line.matchAll(startI18nMarkerRegex)].length -
        [...line.matchAll(endI18nMarkerRegex)].length;

      let lineWasMigrated = false;
      if (line.match(replaceMarkerRegex)) {
        line = line.replace(replaceMarkerRegex, '');
        lineWasMigrated = true;
      }

      if (
        line.trim() === '' &&
        index !== 0 &&
        index !== lines.length - 1 &&
        (inMigratedBlock || lineWasMigrated) &&
        !inI18nBlock &&
        !inAttribute
      ) {
        continue;
      }

      if (templateType === 'template' && index <= 1) {
        const ind = line.search(/\S/);
        mindent = ind > -1 ? line.slice(0, ind) : '';
      }

      if (
        (closeBlockRegex.test(line) ||
          (closeElRegex.test(line) &&
            !singleLineElRegex.test(line) &&
            !closeMultiLineElRegex.test(line))) &&
        indent !== ''
      ) {
        indent = indent.slice(2);
      }

      const isOpenDoubleAttr = openAttrDoubleRegex.test(line);
      const isOpenSingleAttr = openAttrSingleRegex.test(line);
      if (!inAttribute && isOpenDoubleAttr) {
        inAttribute = true;
        isDoubleQuotes = true;
      } else if (!inAttribute && isOpenSingleAttr) {
        inAttribute = true;
        isDoubleQuotes = false;
      }

      const newLine =
        inI18nBlock || inAttribute
          ? line
          : mindent + (line.trim() !== '' ? indent : '') + line.trim();
      formatted.push(newLine);

      if (
        !isOpenDoubleAttr &&
        !isOpenSingleAttr &&
        ((inAttribute && isDoubleQuotes && closeAttrDoubleRegex.test(line)) ||
          (inAttribute && !isDoubleQuotes && closeAttrSingleRegex.test(line)))
      ) {
        inAttribute = false;
      }

      if (closeMultiLineElRegex.test(line)) {
        indent = indent.slice(2);
        if (openSelfClosingEl) {
          openSelfClosingEl = false;
        }
      }

      if (closeSelfClosingMultiLineRegex.test(line) && openSelfClosingEl) {
        openSelfClosingEl = false;
        indent = indent.slice(2);
      }

      if (
        (openBlockRegex.test(line) || openElRegex.test(line)) &&
        !singleLineElRegex.test(line) &&
        !selfClosingRegex.test(line) &&
        !openSelfClosingRegex.test(line)
      ) {
        indent += '  ';
      }

      if (openSelfClosingRegex.test(line)) {
        openSelfClosingEl = true;
        indent += '  ';
      }

      inI18nBlock = i18nDepth > 0;
    }

    tmpl = formatted.join('\n');
  }
  return tmpl;
}

// Utility to walk through directories recursively and collect .component.html files
function getHtmlFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getHtmlFiles(fullPath, files);
    } else if (file.endsWith('.component.html')) {
      files.push(fullPath);
    }
  });
  return files;
}

// Main
// const projectRoot = process.cwd();
// const htmlFiles = getHtmlFiles(path.join(projectRoot, 'src'));

// if (htmlFiles.length === 0) {
//   console.log('No .component.html files found.');
//   process.exit(0);
// }

// htmlFiles.forEach(filePath => {
//   const original = fs.readFileSync(filePath, 'utf8');
//   const formatted = formatTemplate(original, 'html');
//   fs.writeFileSync(filePath, formatted, 'utf8');
//   console.log(`✅ Formatted: ${filePath}`);
// });


function formatFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const formatted = formatTemplate(original, 'html');
  fs.writeFileSync(filePath, formatted, 'utf8');
  console.log(`✅ Formatted: ${filePath}`);
}

// Entry point
const args = process.argv.slice(2);
if (args.length > 0) {
  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  formatFile(filePath);
} else {
  const projectRoot = process.cwd();
  const htmlFiles = getHtmlFiles(path.join(projectRoot, 'src'));
  if (htmlFiles.length === 0) {
    console.log('No .component.html files found in src.');
    process.exit(0);
  }
  htmlFiles.forEach(formatFile);
}
