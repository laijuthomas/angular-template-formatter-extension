# Angular Template Formatter VS Code Extension

A VS Code extension tool for formatting Angular component HTML templates via context menu.

---

## 📦 Installation & Usage

### 1. Install VS Code Extension CLI

```bash
npm install -g vsce
```

---

### 2. Build the Extension

Inside the extension folder, update the scriptPath in extension.ts based on the user directory and run below

```bash
npm install
npm run compile
```

---

### 3. Package the Extension

```bash
vsce package
```

This will generate a file like:

```
angular-template-formatter-0.0.1.vsix
```

---

### 4. Install the `.vsix` in VS Code

1. Open **Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run **Extensions: Install from VSIX...**
3. Select the generated `angular-template-formatter-0.0.1.vsix`
4. Done 🎉

---

### ✅ Use the Extension

After installation:

1. Open any `.component.html` file in your Angular project
2. Right-click anywhere in the editor
3. Choose **“Format Angular Template”**

It will format the currently open file using your custom formatter script.

---
