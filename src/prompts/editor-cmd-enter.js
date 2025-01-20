const EditorPrompt = require('inquirer/lib/prompts/editor');

class EditorCmdEnterPrompt extends EditorPrompt {
    constructor(questions, rl, answers) {
        super(questions, rl, answers);
        
        // Sobrescrever o comportamento padrão do editor
        this.opt.waitForSubmit = true;
        this.currentText = '';
        
        // Configurar handler para Command + Enter
        this.rl.input.on('keypress', (_, key) => {
            if (key && key.meta && key.name === 'return') {
                this.submit();
            }
        });
    }

    submit() {
        this.currentText = this.currentText.trim();
        if (this.currentText) {
            this.done(this.currentText);
        }
    }

    _write(text) {
        this.currentText = text;
        super._write(text);
    }
}

module.exports = EditorCmdEnterPrompt;
