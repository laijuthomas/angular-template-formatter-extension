import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('angularFormatter.formatHtml', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
    }

    const docPath = editor.document.fileName;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const scriptPath = '/Users/yourname/angular-template-formatter-extension/format-template.js';
    exec(`node "${scriptPath}" "${docPath}"`, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage(`Error formatting template: ${stderr}`);
      } else {
        vscode.window.showInformationMessage('Template formatted.');
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}