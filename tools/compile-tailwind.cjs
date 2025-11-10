const fs = require('fs');
const postcss = require('postcss');
const tailwindPostcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

const inputPath = 'src/index.css';
const outPath = 'tools-test-output.css';

const css = fs.readFileSync(inputPath, 'utf8');

postcss([tailwindPostcss(), autoprefixer()])
  .process(css, { from: inputPath })
  .then(result => {
    fs.writeFileSync(outPath, result.css);
    console.log('Wrote', outPath);
  })
  .catch(err => {
    console.error('Processing error:', err);
    process.exit(1);
  });
