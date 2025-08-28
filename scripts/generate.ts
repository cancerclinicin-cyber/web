#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function createComponent(basePath: string, componentName: string) {
  const filePath = path.join(basePath, `${componentName}.tsx`);
  const cssFileName = `${componentName}.module.css`;
  const componentCode = `import React from 'react';
import styles from './${cssFileName}';

export default function ${componentName}() {
  return (
    <>
      <h1 className={styles.${componentName.toLowerCase()}}>${componentName} works</h1>
    </>
  );
}
`;

  fs.writeFileSync(filePath, componentCode);
  console.log(`✅ Component "${componentName}" created at ${filePath}`);

  // Also create CSS module file when generating component
  createStyle(basePath, componentName);
}

function createStyle(basePath: string, componentName: string) {
  const stylePath = path.join(basePath, `${componentName}.module.css`);
  const styleCode = `/* Styles for ${componentName} */
.${componentName.toLowerCase()} {
  /* Add styles here */
}
`;
  fs.writeFileSync(stylePath, styleCode);
  console.log(`🎨 Style file created at ${stylePath}`);
}

function createHelper(basePath: string, helperName: string) {
  const helperPath = path.join(basePath, `${helperName}.ts`);
  const helperCode = `// Helper functions for ${helperName}

export const exampleHelper = () => {
  console.log('Helper function for ${helperName}');
};
`;
  fs.writeFileSync(helperPath, helperCode);
  console.log(`🛠️ Helper file created at ${helperPath}`);
}

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (ans) => resolve(ans.trim()));
  });
}

async function main() {
  try {
    const fileType = await askQuestion('What do you want to create? (component, style, helper): ');
    if (!['component', 'style', 'helper'].includes(fileType)) {
      console.error('❌ Unsupported type. Supported types: component, style, helper');
      rl.close();
      process.exit(1);
    }

    const inputPath = await askQuestion('Enter the full path relative to src (e.g., components/Home/Home): ');
    if (!inputPath) {
      console.error('❌ Path is required');
      rl.close();
      process.exit(1);
    }

    const parts = inputPath.split('/');
    const basePath = path.join('src', ...parts.slice(0, -1));
    const name = parts[parts.length - 1];

    fs.mkdirSync(basePath, { recursive: true });

    switch (fileType) {
      case 'component':
        createComponent(basePath, name);
        break;
      case 'style':
        createStyle(basePath, name);
        break;
      case 'helper':
        createHelper(basePath, name);
        break;
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();
