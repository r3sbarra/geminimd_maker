document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gemini-form');
    const geminiOutput = document.getElementById('gemini-output');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const importButton = document.getElementById('import-button');
    const importFile = document.getElementById('import-file');
    const copyButton = document.getElementById('copy-button');
    const downloadButton = document.getElementById('download-button');
    const saveTemplateButton = document.getElementById('save-template-button');
    const templateModal = document.getElementById('template-modal');
    const closeModal = document.querySelector('.close-button');
    const saveCustomTemplateButton = document.getElementById('save-custom-template-button');
    const templateNameInput = document.getElementById('template-name');
    const templateSelect = document.getElementById('template');

    const templates = {
        custom: {
            projectName: '',
            projectDescription: '',
            projectLanguage: 'Python',
            projectOwner: '',
            persona: '',
            outputFormat: 'Markdown',
            instructions: '',
            usage: '',
            contributing: ''
        },
        basic: {
            projectName: 'My Awesome Project',
            projectDescription: 'A brief description of my awesome project.',
            projectLanguage: 'Python',
            projectOwner: 'Your Name',
            persona: 'You are a helpful assistant.',
            outputFormat: 'Markdown',
            instructions: 'Follow standard coding practices.',
            usage: 'Run `python main.py` to start.',
            contributing: 'Please read the contributing guidelines before submitting a pull request.'
        },
        'web-app': {
            projectName: 'My Web App',
            projectDescription: 'A web application that does amazing things.',
            projectLanguage: 'JavaScript',
            projectOwner: 'Your Name',
            persona: 'You are a full-stack web developer.',
            outputFormat: 'HTML',
            instructions: 'Use React components and follow the Material Design guidelines.',
            usage: 'Run `npm start` to launch the development server.',
            contributing: 'Contributions are welcome! Please create an issue to discuss your ideas.'
        },
        cli: {
            projectName: 'My CLI Tool',
            projectDescription: 'A command-line interface for performing useful tasks.',
            projectLanguage: 'Go',
            projectOwner: 'Your Name',
            persona: 'You are a command-line tool expert.',
            outputFormat: 'Markdown',
            instructions: 'Use the Cobra library for commands and flags.',
            usage: 'Run `./my-cli-tool --help` to see available commands.',
            contributing: 'Please report any bugs or feature requests in the issue tracker.'
        }
    };

    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || {};

    function populateTemplateSelect() {
        for (const key in customTemplates) {
            if (!templateSelect.querySelector(`option[value="${key}"]`)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                templateSelect.appendChild(option);
            }
        }
    }

    function generateGeminiContent() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        return `
# ${data['project-name']}

**Owner**: ${data['project-owner'] || 'N/A'}

## Description

${data['project-description']}

## Language

${data['project-language']}

## Persona

${data.persona || 'N/A'}

## Output Format

${data['output-format']}

## Instructions

${data.instructions || 'N/A'}

## Usage

${data.usage || 'N/A'}

## Contributing

${data.contributing || 'N/A'}

`;
    }

    function updatePreview() {
        const content = generateGeminiContent();
        geminiOutput.textContent = content;
        hljs.highlightElement(geminiOutput);
    }

    function setTemplate(templateName) {
        const allTemplates = { ...templates, ...customTemplates };
        const template = allTemplates[templateName];
        if (template) {
            for (const key in template) {
                const element = document.getElementById(key.replace(/([A-Z])/g, "-$1").toLowerCase());
                if (element) {
                    element.value = template[key];
                }
            }
        }
        updatePreview();
    }

    form.addEventListener('input', updatePreview);

    templateSelect.addEventListener('change', (e) => {
        setTemplate(e.target.value);
    });

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    importButton.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // This is a simple parsing logic. A more robust solution would be needed for complex GEMINI.md files.
                const content = event.target.result;
                const lines = content.split('\n');
                const data = {};
                let currentSection = '';

                lines.forEach(line => {
                    if (line.startsWith('# ')) {
                        data.projectName = line.substring(2);
                    } else if (line.startsWith('**Owner**')) {
                        data.projectOwner = line.split(':')[1].trim();
                    } else if (line.startsWith('## ')) {
                        currentSection = line.substring(3).toLowerCase();
                    } else if (currentSection && line.trim()) {
                        if (!data[currentSection]) {
                            data[currentSection] = '';
                        }
                        data[currentSection] += line + '\n';
                    }
                });

                document.getElementById('project-name').value = data.projectName || '';
                document.getElementById('project-owner').value = data.projectOwner || '';
                document.getElementById('project-description').value = data.description || '';
                document.getElementById('project-language').value = data.language || '';
                document.getElementById('persona').value = data.persona || '';
                document.getElementById('output-format').value = data.outputFormat || '';
                document.getElementById('instructions').value = data.instructions || '';
                document.getElementById('usage').value = data.usage || '';
                document.getElementById('contributing').value = data.contributing || '';

                updatePreview();
            };
            reader.readAsText(file);
        }
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(geminiOutput.textContent).then(() => {
            alert('Copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    });

    downloadButton.addEventListener('click', () => {
        const blob = new Blob([geminiOutput.textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GEMINI.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    saveTemplateButton.addEventListener('click', () => {
        templateModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        templateModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });

    saveCustomTemplateButton.addEventListener('click', () => {
        const name = templateNameInput.value.trim();
        if (name) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            customTemplates[name] = data;
            localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
            populateTemplateSelect();
            templateSelect.value = name;
            templateModal.style.display = 'none';
            templateNameInput.value = '';
        }
    });

    populateTemplateSelect();
    setTemplate('basic');
});
